import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { githubUrl } = await req.json();

    if (!githubUrl) {
      return NextResponse.json({ success: false, error: "GitHub URL is required" }, { status: 400 });
    }

    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json({ success: false, error: "Invalid GitHub URL format" }, { status: 400 });
    }

    const [_, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");

    const headers: HeadersInit = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "MongoFlow-Studio",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // 1. Get repository info to find default branch
    const repoInfoUrl = `https://api.github.com/repos/${owner}/${cleanRepo}`;
    const repoInfoResponse = await fetch(repoInfoUrl, { headers });
    
    if (!repoInfoResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch repository info: ${repoInfoResponse.statusText}` 
      }, { status: repoInfoResponse.status });
    }

    const repoData = await repoInfoResponse.json();
    const defaultBranch = repoData.default_branch || "main";

    // 2. Fetch the repository tree
    const treeUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${defaultBranch}?recursive=1`;
    const treeResponse = await fetch(treeUrl, { headers });
    
    if (!treeResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch repository tree: ${treeResponse.statusText}` 
      }, { status: treeResponse.status });
    }

    const treeData = await treeResponse.json();
    const files = treeData.tree.filter((item: any) => item.type === "blob");
    const totalFiles = files.length;

    const filePatterns = /\.(js|ts|jsx|tsx|py|go|rb|php|java|cs)$/;
    const analysisFiles = files.filter((file: any) => filePatterns.test(file.path));
    
    // Limits the number of files to analyze to avoid rate limits and timeouts
    const sampleFiles = analysisFiles.slice(0, 30); 

    const results = {
      files: [] as any[],
      operations: {
        inserts: 0,
        finds: 0,
        updates: 0,
        deletes: 0,
        aggregates: 0,
      },
      collections: new Set<string>(),
      mongoFiles: 0,
    };

    // Parallel analysis (limited)
    await Promise.all(sampleFiles.map(async (file: any) => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${defaultBranch}/${file.path}`;
        const contentResponse = await fetch(rawUrl, { headers });
        
        if (contentResponse.ok) {
          const content = await contentResponse.text();
          const foundOps: string[] = [];
          
          if (content.includes("insertOne") || content.includes("insertMany")) {
            foundOps.push("insert");
            results.operations.inserts++;
          }
          if (content.includes(".find(") || content.includes(".findOne(")) {
            foundOps.push("find");
            results.operations.finds++;
          }
          if (content.includes("updateOne") || content.includes("updateMany")) {
            foundOps.push("update");
            results.operations.updates++;
          }
          if (content.includes("deleteOne") || content.includes("deleteMany")) {
            foundOps.push("delete");
            results.operations.deletes++;
          }
          if (content.includes("aggregate(")) {
            foundOps.push("aggregate");
            results.operations.aggregates++;
          }

          if (foundOps.length > 0 || content.includes("mongodb") || content.includes("mongoose") || content.includes("MongoClient")) {
            results.mongoFiles++;
            results.files.push({
              name: file.path.split("/").pop(),
              path: file.path,
              mongoOperations: foundOps,
            });

            // Try to find collections (simple regex)
            const collectionMatches = content.match(/db\.collection\(['"]([^'"]+)['"]\)/g) || 
                                     content.match(/mongoose\.model\(['"]([^'"]+)['"]\)/g) ||
                                     content.match(/collection\(['"]([^'"]+)['"]\)/g);
            if (collectionMatches) {
              collectionMatches.forEach(m => {
                const nameMatch = m.match(/['"]([^'"]+)['"]/);
                if (nameMatch?.[1]) results.collections.add(nameMatch[1]);
              });
            }
          }
        }
      } catch (e) {
        // Skip file on error
      }
    }));

    // If no collections found, try to guess from file paths or common patterns
    if (results.collections.size === 0) {
      const commonCollections = ["users", "products", "orders", "posts", "comments", "sessions", "accounts"];
      commonCollections.forEach(c => {
        if (files.some((f: any) => f.path.toLowerCase().includes(c))) {
          results.collections.add(c);
        }
      });
    }

    // Generate flow diagram
    const flowDiagram = [];
    
    // Find Controllers/Handlers
    const controllerFiles = results.files.filter(f => 
      f.path.toLowerCase().includes("controller") || 
      f.path.toLowerCase().includes("api/") || 
      f.path.toLowerCase().includes("handlers/")
    );
    
    if (controllerFiles.length > 0) {
      flowDiagram.push({
        id: "1",
        type: "controller",
        label: controllerFiles[0].name.replace(/\.(js|ts|jsx|tsx)$/, ""),
        file: controllerFiles[0].path,
        operations: controllerFiles[0].mongoOperations.length > 0 ? controllerFiles[0].mongoOperations : ["API Handlers"],
      });
    } else {
      flowDiagram.push({
        id: "1",
        type: "controller",
        label: "API Gateway",
        operations: ["Route Handling"],
      });
    }

    // Find Services/Logic
    const serviceFiles = results.files.filter(f => 
      f.path.toLowerCase().includes("service") || 
      f.path.toLowerCase().includes("lib/") || 
      f.path.toLowerCase().includes("utils/")
    );
    
    if (serviceFiles.length > 0) {
      flowDiagram.push({
        id: "2",
        type: "service",
        label: serviceFiles[0].name.replace(/\.(js|ts)$/, ""),
        file: serviceFiles[0].path,
        operations: serviceFiles[0].mongoOperations,
      });
    }

    // Find Models
    const modelFiles = results.files.filter(f => 
      f.path.toLowerCase().includes("model") || 
      f.path.toLowerCase().includes("schemas") ||
      f.path.toLowerCase().includes("entities")
    );
    
    if (modelFiles.length > 0) {
      flowDiagram.push({
        id: "3",
        type: "model",
        label: modelFiles[0].name.replace(/\.(js|ts)$/, ""),
        file: modelFiles[0].path,
        operations: [],
      });
    }

    // Database node (always present)
    flowDiagram.push({
      id: "4",
      type: "database",
      label: "MongoDB",
      operations: ["CRUD"],
    });

    return NextResponse.json({
      success: true,
      files: results.files,
      totalFiles,
      mongoFiles: results.mongoFiles,
      operations: results.operations,
      collections: Array.from(results.collections),
      flowDiagram,
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ success: false, error: "Failed to analyze repository. It might be too large or private." }, { status: 500 });
  }
}
