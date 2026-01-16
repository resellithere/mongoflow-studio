"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  Play,
  RotateCcw,
  Zap,
  Clock,
  FileJson,
  Server,
  HardDrive,
  Loader2,
  Check,
  X,
  ChevronRight,
  Braces,
  Search,
  Trash2,
  RefreshCw,
  Plus,
  List,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  Github,
  FileCode,
  Folder,
  Workflow,
  Box,
  Layers,
  Activity,
  BarChart3,
  Code2,
  GitBranch,
  Eye,
  Timer,
  Network,
  History,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Operation =
  | "insert"
  | "find"
  | "update"
  | "delete"
  | "aggregate"
  | "bulk-insert";

type PerformanceEntry = {
  timestamp: number;
  operation: string;
  executionTime: number;
  documentsExamined?: number;
  documentsReturned?: number;
  indexUsed?: string;
};

type CollStats = {
  documentCount: number;
  storageSize: number;
  avgObjSize: number;
  indexCount: number;
  totalIndexSize: number;
  indexes: { name: string; key: Record<string, number>; unique: boolean }[];
};

type FlowStep = {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "idle" | "active" | "completed" | "error";
  details?: string;
  dataPreview?: string;
};

type Lesson = {
  id: string;
  title: string;
  category: "beginner" | "intermediate" | "advanced";
  objective: string;
  explanation: string;
  operation: Operation;
  sampleData: unknown;
  expectedResult: string;
  tips: string[];
  nextLesson?: string;
};

type FlowNode = {
  id: string;
  type: "controller" | "service" | "model" | "database";
  label: string;
  file?: string;
  operations: string[];
};

type AnalysisResult = {
  files: { name: string; path: string; mongoOperations: string[] }[];
  totalFiles: number;
  mongoFiles: number;
  operations: {
    inserts: number;
    finds: number;
    updates: number;
    deletes: number;
    aggregates: number;
  };
  collections: string[];
  flowDiagram: FlowNode[];
};

const LESSONS: Lesson[] = [
  {
    id: "insert-basics",
    title: "Your First Insert",
    category: "beginner",
    objective: "Learn how to insert a single document into MongoDB",
    explanation: "The insertOne() operation adds a single document to a collection. MongoDB automatically creates a unique _id field if you don't provide one. Documents are stored as BSON (Binary JSON), which supports additional data types like Date and ObjectId.",
    operation: "insert",
    sampleData: {
      name: "Sarah Connor",
      email: "sarah@skynet.com",
      age: 35,
      role: "resistance_leader"
    },
    expectedResult: "A new document will be created with an auto-generated _id. The response shows 'acknowledged: true' and the insertedId.",
    tips: [
      "MongoDB is schema-flexible - you can add different fields to different documents",
      "The _id field is automatically indexed for fast lookups",
      "Use meaningful field names for better queryability"
    ],
    nextLesson: "bulk-insert-basics"
  },
  {
    id: "bulk-insert-basics",
    title: "Bulk Insert Multiple Documents",
    category: "beginner",
    objective: "Learn how to insert multiple documents at once",
    explanation: "The insertMany() operation efficiently inserts multiple documents in a single database call. This is much faster than inserting documents one by one, especially when dealing with large datasets.",
    operation: "bulk-insert",
    sampleData: [
      { name: "Neo", email: "neo@matrix.com", age: 30, role: "the_one" },
      { name: "Trinity", email: "trinity@matrix.com", age: 28, role: "hacker" },
      { name: "Morpheus", email: "morpheus@matrix.com", age: 45, role: "captain" }
    ],
    expectedResult: "All documents will be inserted and you'll see the count of inserted documents along with their generated _ids.",
    tips: [
      "Bulk operations are atomic by default - all succeed or all fail",
      "Use ordered: false option to continue inserting even if one fails",
      "Maximum 100 documents per batch in this demo"
    ],
    nextLesson: "find-all"
  },
  {
    id: "find-all",
    title: "Finding Documents",
    category: "beginner",
    objective: "Learn how to query and retrieve documents",
    explanation: "The find() operation retrieves documents from a collection. An empty query {} returns all documents. You can add conditions to filter results using comparison operators like $eq, $gt, $lt, etc.",
    operation: "find",
    sampleData: {},
    expectedResult: "All documents in the collection will be returned. The response includes execution metrics and query plan information.",
    tips: [
      "Empty query {} returns all documents (limited to 100 in this demo)",
      "MongoDB returns a cursor - we convert it to an array",
      "Check the 'indexUsed' field to see if your query uses an index"
    ],
    nextLesson: "find-filter"
  },
  {
    id: "find-filter",
    title: "Filtering with Conditions",
    category: "beginner",
    objective: "Learn to filter documents using query operators",
    explanation: "MongoDB provides powerful query operators: $gt (greater than), $gte (greater than or equal), $lt (less than), $lte (less than or equal), $eq (equal), $ne (not equal), $in (in array), $regex (pattern matching).",
    operation: "find",
    sampleData: { age: { $gte: 30 } },
    expectedResult: "Only documents where age is 30 or higher will be returned. Notice how the query plan shows which fields were examined.",
    tips: [
      "Combine multiple conditions: { age: { $gte: 25, $lte: 40 } }",
      "Use $or for alternative conditions: { $or: [{ age: 30 }, { role: 'admin' }] }",
      "String queries are case-sensitive by default"
    ],
    nextLesson: "update-basics"
  },
  {
    id: "update-basics",
    title: "Updating Documents",
    category: "beginner",
    objective: "Learn how to modify existing documents",
    explanation: "The updateMany() operation modifies documents matching a filter. Use $set to update specific fields without affecting others. Other update operators include $inc (increment), $unset (remove field), $push (add to array), $pull (remove from array).",
    operation: "update",
    sampleData: {
      filter: { role: "the_one" },
      update: { $set: { status: "awakened", power_level: 9001 } }
    },
    expectedResult: "Documents matching the filter will be updated. The response shows matchedCount and modifiedCount.",
    tips: [
      "Always use update operators ($set, $inc, etc.) - don't replace the entire document",
      "Use $inc to increment numbers: { $inc: { views: 1 } }",
      "modifiedCount may differ from matchedCount if values are already set"
    ],
    nextLesson: "delete-basics"
  },
  {
    id: "delete-basics",
    title: "Deleting Documents",
    category: "beginner",
    objective: "Learn how to remove documents from a collection",
    explanation: "The deleteMany() operation removes all documents matching the filter. Use with caution - deleted data cannot be recovered! Always test your filter with find() first to verify which documents will be affected.",
    operation: "delete",
    sampleData: { role: "captain" },
    expectedResult: "All documents matching the filter will be permanently deleted. The response shows deletedCount.",
    tips: [
      "Test with find() first to see what will be deleted",
      "Empty filter {} deletes ALL documents - be careful!",
      "Consider soft deletes (adding a 'deleted' field) for recoverable deletions"
    ],
    nextLesson: "aggregate-match"
  },
  {
    id: "aggregate-match",
    title: "Aggregation: $match Stage",
    category: "intermediate",
    objective: "Learn the aggregation pipeline and $match stage",
    explanation: "The aggregation pipeline processes documents through multiple stages. $match filters documents (similar to find). Place $match early in the pipeline to reduce the number of documents processed by later stages.",
    operation: "aggregate",
    sampleData: [
      { $match: { age: { $gte: 25 } } }
    ],
    expectedResult: "Documents passing the $match condition will be returned. This is similar to find() but can be combined with other stages.",
    tips: [
      "$match uses the same query syntax as find()",
      "Place $match early to reduce documents in the pipeline",
      "$match can use indexes, improving performance"
    ],
    nextLesson: "aggregate-group"
  },
  {
    id: "aggregate-group",
    title: "Aggregation: $group Stage",
    category: "intermediate",
    objective: "Learn to group and aggregate data",
    explanation: "$group combines documents by a specified _id field and calculates aggregate values. Use accumulator operators like $sum, $avg, $min, $max, $push, $first, $last to compute values across grouped documents.",
    operation: "aggregate",
    sampleData: [
      { $group: { _id: "$role", count: { $sum: 1 }, avgAge: { $avg: "$age" } } }
    ],
    expectedResult: "Documents will be grouped by the 'role' field. Each group shows the count and average age.",
    tips: [
      "_id: null groups all documents together",
      "Use $sum: 1 to count documents in each group",
      "Field references start with $ (e.g., '$fieldName')"
    ],
    nextLesson: "aggregate-sort"
  },
  {
    id: "aggregate-sort",
    title: "Aggregation: $sort & $limit",
    category: "intermediate",
    objective: "Learn to sort and limit aggregation results",
    explanation: "$sort orders documents by specified fields (1 for ascending, -1 for descending). $limit restricts the number of results. $skip can be used for pagination. These stages are commonly used together.",
    operation: "aggregate",
    sampleData: [
      { $match: { age: { $exists: true } } },
      { $sort: { age: -1 } },
      { $limit: 3 }
    ],
    expectedResult: "The top 3 oldest people will be returned, sorted by age in descending order.",
    tips: [
      "Sort before $limit to get 'top N' results",
      "Sorting large datasets without an index is slow",
      "Use { $skip: N } for pagination"
    ],
    nextLesson: "aggregate-project"
  },
  {
    id: "aggregate-project",
    title: "Aggregation: $project Stage",
    category: "intermediate",
    objective: "Learn to reshape documents with $project",
    explanation: "$project specifies which fields to include, exclude, or compute. Use 1 to include, 0 to exclude, or expressions to compute new fields. This is useful for data transformation and reducing response size.",
    operation: "aggregate",
    sampleData: [
      { 
        $project: { 
          _id: 0,
          fullName: { $toUpper: "$name" },
          email: 1,
          ageGroup: { 
            $cond: { 
              if: { $gte: ["$age", 30] }, 
              then: "senior", 
              else: "junior" 
            } 
          }
        } 
      }
    ],
    expectedResult: "Documents will be reshaped with uppercase names, emails, and a computed ageGroup field.",
    tips: [
      "_id is included by default - use _id: 0 to exclude",
      "Use $concat to combine strings: { $concat: ['$firstName', ' ', '$lastName'] }",
      "$cond provides if-then-else logic"
    ],
    nextLesson: "aggregate-lookup"
  },
  {
    id: "aggregate-lookup",
    title: "Aggregation: $unwind",
    category: "advanced",
    objective: "Learn to deconstruct arrays with $unwind",
    explanation: "$unwind deconstructs an array field, outputting one document for each element. This is useful for array analysis, normalization, or preparing data for $group operations on array elements.",
    operation: "aggregate",
    sampleData: [
      { $match: { name: { $exists: true } } },
      { $project: { name: 1, letters: { $split: ["$name", ""] } } },
      { $unwind: "$letters" },
      { $group: { _id: "$letters", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ],
    expectedResult: "This complex pipeline splits names into letters, unwinds them, and counts letter frequency - showing the most common letters.",
    tips: [
      "$unwind creates one document per array element",
      "Use preserveNullAndEmptyArrays: true to keep documents with empty arrays",
      "Great for analyzing nested data structures"
    ]
  }
];

const SAMPLE_DATA = {
  users: [
    { name: "Alice Johnson", email: "alice@example.com", age: 28, department: "Engineering" },
    { name: "Bob Smith", email: "bob@example.com", age: 34, department: "Marketing" },
    { name: "Carol Davis", email: "carol@example.com", age: 25, department: "Engineering" },
    { name: "David Wilson", email: "david@example.com", age: 42, department: "Sales" },
    { name: "Eve Martinez", email: "eve@example.com", age: 31, department: "HR" },
  ],
  products: [
    { name: "Laptop Pro", price: 1299.99, category: "Electronics", stock: 50 },
    { name: "Wireless Mouse", price: 29.99, category: "Electronics", stock: 200 },
    { name: "Office Chair", price: 349.99, category: "Furniture", stock: 30 },
    { name: "Desk Lamp", price: 49.99, category: "Furniture", stock: 100 },
    { name: "USB Hub", price: 19.99, category: "Electronics", stock: 150 },
  ],
  orders: [
    { orderId: "ORD001", customer: "Alice Johnson", total: 1329.98, status: "shipped" },
    { orderId: "ORD002", customer: "Bob Smith", total: 399.98, status: "pending" },
    { orderId: "ORD003", customer: "Carol Davis", total: 69.98, status: "delivered" },
    { orderId: "ORD004", customer: "David Wilson", total: 1649.97, status: "processing" },
  ],
};

const PLACEHOLDERS: Record<Operation, string> = {
  insert: JSON.stringify({ name: "John Doe", email: "john@example.com", age: 30 }, null, 2),
  find: JSON.stringify({ age: { $gte: 25 } }, null, 2),
  update: JSON.stringify(
    { filter: { name: "John Doe" }, update: { $set: { age: 31 } } },
    null,
    2
  ),
  delete: JSON.stringify({ name: "John Doe" }, null, 2),
  aggregate: JSON.stringify(
    [{ $match: { age: { $gte: 25 } } }, { $group: { _id: "$department", count: { $sum: 1 } } }],
    null,
    2
  ),
  "bulk-insert": JSON.stringify(
    [
      { name: "User 1", email: "user1@example.com" },
      { name: "User 2", email: "user2@example.com" },
    ],
    null,
    2
  ),
};

const OPERATION_ICONS: Record<Operation, React.ReactNode> = {
  insert: <Plus className="h-4 w-4" />,
  find: <Search className="h-4 w-4" />,
  update: <RefreshCw className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  aggregate: <Braces className="h-4 w-4" />,
  "bulk-insert": <List className="h-4 w-4" />,
};

const CATEGORY_COLORS = {
  beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  advanced: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

const DataPacket = ({ delay, duration }: { delay: number; duration: number }) => (
  <motion.div
    className="absolute h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
    initial={{ left: "0%", opacity: 0 }}
    animate={{
      left: ["0%", "100%"],
      opacity: [0, 1, 1, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      repeatDelay: 1,
      ease: "easeInOut",
    }}
  />
);

const PulseRing = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <>
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-emerald-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-teal-400"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.25, opacity: 0 }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
        />
      </>
    )}
  </AnimatePresence>
);

const FloatingParticle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute h-1 w-1 rounded-full bg-emerald-400/60"
    initial={{ 
      x: Math.random() * 100, 
      y: Math.random() * 100,
      opacity: 0 
    }}
    animate={{ 
      y: [null, -20, 0],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 2,
    }}
  />
);

export default function Home() {
  const [activeTab, setActiveTab] = useState("playground");
  const [operation, setOperation] = useState<Operation>("insert");
  const [jsonInput, setJsonInput] = useState(PLACEHOLDERS.insert);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([
    { id: "ui", label: "UI Input", icon: <FileJson className="h-5 w-5" />, status: "idle" },
    { id: "frontend", label: "Frontend", icon: <Zap className="h-5 w-5" />, status: "idle" },
    { id: "api", label: "API Route", icon: <Server className="h-5 w-5" />, status: "idle" },
    { id: "mongodb", label: "MongoDB", icon: <Database className="h-5 w-5" />, status: "idle" },
    { id: "bson", label: "BSON", icon: <HardDrive className="h-5 w-5" />, status: "idle" },
  ]);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [showTip, setShowTip] = useState(false);

  const [githubUrl, setGithubUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [flowSpeed, setFlowSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [showLiveMetrics, setShowLiveMetrics] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState({
    requestsPerSec: 0,
    avgLatency: 0,
    activeConnections: 1,
    dataTransferred: 0,
  });

  const [performanceLog, setPerformanceLog] = useState<PerformanceEntry[]>([]);
  const [collStats, setCollStats] = useState<CollStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.success) setCollStats(data.data);
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("mongoflow-completed-lessons");
    if (saved) {
      setCompletedLessons(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLiveMetrics(prev => ({
          requestsPerSec: Math.random() * 10 + 5,
          avgLatency: Math.random() * 50 + 10,
          activeConnections: Math.floor(Math.random() * 3) + 1,
          dataTransferred: prev.dataTransferred + Math.random() * 100,
        }));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const saveProgress = (lessonId: string) => {
    const updated = new Set(completedLessons);
    updated.add(lessonId);
    setCompletedLessons(updated);
    localStorage.setItem("mongoflow-completed-lessons", JSON.stringify([...updated]));
  };

  const resetFlow = useCallback(() => {
    setFlowSteps((steps) => steps.map((s) => ({ ...s, status: "idle", details: undefined, dataPreview: undefined })));
  }, []);

  const updateFlowStep = useCallback(
    (id: string, status: FlowStep["status"], details?: string, dataPreview?: string) => {
      setFlowSteps((steps) =>
        steps.map((s) => (s.id === id ? { ...s, status, details, dataPreview } : s))
      );
    },
    []
  );

  const handleOperationChange = (value: Operation) => {
    setOperation(value);
    setJsonInput(PLACEHOLDERS[value]);
    setResult(null);
    setError(null);
    resetFlow();
  };

  const loadSampleData = async (dataset: keyof typeof SAMPLE_DATA) => {
    setJsonInput(JSON.stringify(SAMPLE_DATA[dataset], null, 2));
    setOperation("bulk-insert");
  };

  const loadLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setOperation(lesson.operation);
    setJsonInput(JSON.stringify(lesson.sampleData, null, 2));
    setResult(null);
    setError(null);
    resetFlow();
    setShowTip(false);
  };

  const tryInPlayground = () => {
    if (selectedLesson) {
      setOperation(selectedLesson.operation);
      setJsonInput(JSON.stringify(selectedLesson.sampleData, null, 2));
      setActiveTab("playground");
    }
  };

  const analyzeGitHubRepo = async () => {
    if (!githubUrl.trim()) {
      setAnalysisError("Please enter a GitHub URL");
      return;
    }

    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      setAnalysisError("Invalid GitHub URL format. Use: https://github.com/owner/repo");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Analysis failed");
      }

      setAnalysisResult(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Failed to analyze repository");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speedMultiplier = flowSpeed === "slow" ? 2 : flowSpeed === "fast" ? 0.5 : 1;

  const executeOperation = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    resetFlow();
    setLiveMetrics(prev => ({ ...prev, dataTransferred: 0 }));

    try {
      updateFlowStep("ui", "active", "Validating JSON...", jsonInput.slice(0, 30) + "...");
      await new Promise((r) => setTimeout(r, 300 * speedMultiplier));
      
      let parsedInput;
      try {
        parsedInput = JSON.parse(jsonInput);
      } catch {
        throw new Error("Invalid JSON format");
      }
      updateFlowStep("ui", "completed", "JSON validated");

      updateFlowStep("frontend", "active", "Preparing request...", `POST /api/${operation}`);
      await new Promise((r) => setTimeout(r, 300 * speedMultiplier));
      updateFlowStep("frontend", "completed", "Request prepared");

      updateFlowStep("api", "active", `${operation.toUpperCase()}...`);
      
      const response = await fetch(`/api/${operation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedInput),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Operation failed");
      }

      updateFlowStep("api", "completed", `${data.metrics?.executionTime}ms`);

      updateFlowStep("mongodb", "active", "Processing...");
      await new Promise((r) => setTimeout(r, 200 * speedMultiplier));
      updateFlowStep("mongodb", "completed", data.metrics?.operation);

      updateFlowStep("bson", "active", "Converting...");
      await new Promise((r) => setTimeout(r, 200 * speedMultiplier));
      updateFlowStep("bson", "completed", "Complete");

      setResult(data);

      if (data.metrics) {
        setPerformanceLog((prev) => [
          {
            timestamp: Date.now(),
            operation: data.metrics.operation,
            executionTime: data.metrics.executionTime,
            documentsExamined: data.metrics.documentsExamined,
            documentsReturned: data.metrics.documentsReturned,
            indexUsed: data.metrics.indexUsed,
          },
          ...prev,
        ].slice(0, 50));
      }

      if (selectedLesson && activeTab === "learning") {
        saveProgress(selectedLesson.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      
      const activeStep = flowSteps.find((s) => s.status === "active");
      if (activeStep) {
        updateFlowStep(activeStep.id, "error", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      const data = await response.json();
      setResult(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (completedLessons.size / LESSONS.length) * 100;

  const beginnerLessons = LESSONS.filter(l => l.category === "beginner");
  const intermediateLessons = LESSONS.filter(l => l.category === "intermediate");
  const advancedLessons = LESSONS.filter(l => l.category === "advanced");

  const getNodeColor = (type: FlowNode["type"]) => {
    switch (type) {
      case "controller": return "from-blue-500 to-blue-600";
      case "service": return "from-purple-500 to-purple-600";
      case "model": return "from-amber-500 to-amber-600";
      case "database": return "from-emerald-500 to-emerald-600";
      default: return "from-slate-500 to-slate-600";
    }
  };

  const getNodeIcon = (type: FlowNode["type"]) => {
    switch (type) {
      case "controller": return <Workflow className="h-5 w-5" />;
      case "service": return <Layers className="h-5 w-5" />;
      case "model": return <Box className="h-5 w-5" />;
      case "database": return <Database className="h-5 w-5" />;
      default: return <Code2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-100 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMDAsMjAwLDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <motion.div
          className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[100px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[100px]"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.2, 0.4, 0.2],
            y: [0, -50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        {[...Array(20)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} />
        ))}
      </div>
      
      <div className="relative">
        <motion.header 
          className="border-b border-emerald-500/20 bg-[#0d1117]/80 backdrop-blur-xl sticky top-0 z-50"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div 
                  className="relative rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Database className="h-6 w-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="font-mono text-xl font-bold tracking-tight text-emerald-400">
                    MongoFlow Studio
                  </h1>
                  <p className="text-xs text-slate-500">
                    Interactive MongoDB Visualization
                  </p>
                </div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetDatabase}
                  disabled={isLoading}
                  className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset DB
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 relative">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TabsList className="bg-[#161b22]/80 backdrop-blur-sm border border-emerald-500/20">
                <TabsTrigger value="playground" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 transition-all">
                  <Play className="mr-2 h-4 w-4" />
                  Playground
                </TabsTrigger>
                <TabsTrigger value="flow" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 transition-all">
                  <Network className="mr-2 h-4 w-4" />
                  Data Flow
                </TabsTrigger>
                <TabsTrigger value="learning" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 transition-all">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Learning
                </TabsTrigger>
                <TabsTrigger value="monitoring" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 transition-all">
                  <Activity className="mr-2 h-4 w-4" />
                  Monitoring
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="playground" className="space-y-6">
              <motion.div 
                className="grid gap-6 lg:grid-cols-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="border-b border-emerald-500/10 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-emerald-400">
                          Operation
                        </CardTitle>
                        <Select value={operation} onValueChange={handleOperationChange}>
                          <SelectTrigger className="w-[180px] border-emerald-500/30 bg-[#0d1117] text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-emerald-500/30 bg-[#161b22] text-slate-100">
                            <SelectItem value="insert">Insert One</SelectItem>
                            <SelectItem value="bulk-insert">Bulk Insert</SelectItem>
                            <SelectItem value="find">Find</SelectItem>
                            <SelectItem value="update">Update</SelectItem>
                            <SelectItem value="delete">Delete</SelectItem>
                            <SelectItem value="aggregate">Aggregate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-slate-400">JSON Input</span>
                          <div className="flex gap-2">
                            {(["users", "products", "orders"] as const).map((dataset) => (
                              <motion.div key={dataset} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => loadSampleData(dataset)}
                                  className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10"
                                >
                                  {dataset.charAt(0).toUpperCase() + dataset.slice(1)}
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                        <motion.textarea
                          value={jsonInput}
                          onChange={(e) => setJsonInput(e.target.value)}
                          className="h-64 w-full rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4 font-mono text-sm text-slate-100 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                          placeholder="Enter JSON here..."
                          whileFocus={{ scale: 1.01 }}
                        />
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={executeOperation}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Execute Operation
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-emerald-500/10 pb-4">
                      <CardTitle className="text-lg text-emerald-400">
                        Result & Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <AnimatePresence mode="wait">
                        {error && (
                          <motion.div
                            key="error"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4"
                          >
                            <div className="flex items-center gap-2 text-red-400">
                              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                                <X className="h-5 w-5" />
                              </motion.div>
                              <span className="font-medium">Error</span>
                            </div>
                            <p className="mt-1 text-sm text-red-300">{error}</p>
                          </motion.div>
                        )}

                        {result && (
                          <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            {result.metrics && (
                              <div className="grid grid-cols-2 gap-3">
                                <motion.div 
                                  className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-3"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 }}
                                  whileHover={{ scale: 1.02, borderColor: "rgba(16, 185, 129, 0.4)" }}
                                >
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Clock className="h-3 w-3" />
                                    Execution Time
                                  </div>
                                  <motion.p 
                                    className="mt-1 font-mono text-lg text-emerald-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    {(result.metrics as Record<string, unknown>).executionTime}ms
                                  </motion.p>
                                </motion.div>
                                <motion.div 
                                  className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-3"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.2 }}
                                  whileHover={{ scale: 1.02, borderColor: "rgba(16, 185, 129, 0.4)" }}
                                >
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Zap className="h-3 w-3" />
                                    Operation
                                  </div>
                                  <p className="mt-1 font-mono text-lg text-emerald-400">
                                    {(result.metrics as Record<string, unknown>).operation as string}
                                  </p>
                                </motion.div>
                              </div>
                            )}

                            <motion.div 
                              className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <div className="mb-2 text-xs text-slate-400">Response Data</div>
                              <pre className="max-h-64 overflow-auto font-mono text-xs text-slate-300">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </motion.div>

                            {result.bsonConversion && (
                              <motion.div 
                                className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                              >
                                <div className="mb-2 flex items-center gap-2 text-xs text-teal-400">
                                  <HardDrive className="h-3 w-3" />
                                  BSON Conversion
                                </div>
                                <pre className="font-mono text-xs text-slate-300">
                                  {JSON.stringify(result.bsonConversion, null, 2)}
                                </pre>
                              </motion.div>
                            )}

                            {result.queryPlan && (
                              <motion.div 
                                className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                              >
                                <div className="mb-2 flex items-center gap-2 text-xs text-amber-400">
                                  <Search className="h-3 w-3" />
                                  Query Plan
                                </div>
                                <pre className="max-h-32 overflow-auto font-mono text-xs text-slate-300">
                                  {JSON.stringify(result.queryPlan, null, 2)}
                                </pre>
                              </motion.div>
                            )}
                          </motion.div>
                        )}

                        {!result && !error && (
                          <motion.div 
                            key="empty"
                            className="flex h-64 items-center justify-center text-slate-500"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div className="text-center">
                              <motion.div
                                animate={{ 
                                  rotateY: [0, 360],
                                  scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <Database className="mx-auto h-12 w-12 opacity-20" />
                              </motion.div>
                              <p className="mt-2">Execute an operation to see results</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="flow">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm">
                  <CardHeader className="border-b border-emerald-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                          <Github className="h-5 w-5" />
                          Analyze GitHub Repository
                        </CardTitle>
                        <p className="text-sm text-slate-400 mt-1">
                          Enter a GitHub repo URL to visualize MongoDB data flow
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                          type="text"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/owner/repository"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-emerald-500/20 bg-[#0d1117] text-slate-100 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                        />
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={analyzeGitHubRepo}
                          disabled={isAnalyzing}
                          className="px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Search className="mr-2 h-4 w-4" />
                              Analyze
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>

                    {analysisError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400"
                      >
                        {analysisError}
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {analysisResult && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 space-y-6"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { label: "Total Files", value: analysisResult.totalFiles, icon: <FileCode className="h-4 w-4" />, color: "emerald" },
                              { label: "MongoDB Files", value: analysisResult.mongoFiles, icon: <Database className="h-4 w-4" />, color: "teal" },
                              { label: "Collections", value: analysisResult.collections.length, icon: <Folder className="h-4 w-4" />, color: "cyan" },
                              { label: "Operations", value: Object.values(analysisResult.operations).reduce((a, b) => a + b, 0), icon: <Activity className="h-4 w-4" />, color: "amber" },
                            ].map((stat, i) => (
                              <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: i * 0.1, type: "spring" }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4 cursor-pointer"
                              >
                                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                  {stat.icon}
                                  {stat.label}
                                </div>
                                <motion.p 
                                  className="text-2xl font-mono text-emerald-400"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: i * 0.1 + 0.3 }}
                                >
                                  {stat.value}
                                </motion.p>
                              </motion.div>
                            ))}
                          </div>

                          <div className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-6">
                            <h3 className="text-lg font-medium text-emerald-400 mb-6 flex items-center gap-2">
                              <Workflow className="h-5 w-5" />
                              Data Flow Architecture
                            </h3>
                            <div className="relative py-8">
                              <div className="flex justify-between items-center">
                                {analysisResult.flowDiagram.map((node, index) => (
                                  <div key={node.id} className="flex items-center">
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      transition={{ delay: index * 0.15, type: "spring", stiffness: 200 }}
                                      whileHover={{ scale: 1.1, y: -5 }}
                                      onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                                      className={`relative cursor-pointer rounded-xl p-5 bg-gradient-to-br ${getNodeColor(node.type)} shadow-lg transition-all`}
                                    >
                                      <PulseRing active={selectedNode?.id === node.id} />
                                      <motion.div 
                                        className="text-white mb-2 flex justify-center"
                                        animate={selectedNode?.id === node.id ? { rotate: [0, 360] } : {}}
                                        transition={{ duration: 1, repeat: selectedNode?.id === node.id ? Infinity : 0, ease: "linear" }}
                                      >
                                        {getNodeIcon(node.type)}
                                      </motion.div>
                                      <p className="text-white text-sm font-medium text-center">{node.label}</p>
                                      <p className="text-white/60 text-xs text-center mt-1 capitalize">{node.type}</p>
                                    </motion.div>
                                    {index < analysisResult.flowDiagram.length - 1 && (
                                      <div className="relative w-12 md:w-20 h-1 mx-2 md:mx-4">
                                        <div className="absolute inset-0 bg-slate-700/50 rounded-full" />
                                        <DataPacket delay={index * 0.4} duration={1.5} />
                                        <DataPacket delay={index * 0.4 + 0.5} duration={1.5} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <AnimatePresence>
                              {selectedNode && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20, height: 0 }}
                                  animate={{ opacity: 1, y: 0, height: "auto" }}
                                  exit={{ opacity: 0, y: 20, height: 0 }}
                                  className="mt-6 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 overflow-hidden"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-emerald-400 flex items-center gap-2">
                                      {getNodeIcon(selectedNode.type)}
                                      {selectedNode.label}
                                    </h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedNode(null)}
                                      className="text-slate-400 hover:text-slate-300"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {selectedNode.file && (
                                    <p className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                                      <FileCode className="h-4 w-4" />
                                      {selectedNode.file}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2">
                                    {selectedNode.operations.map((op, i) => (
                                      <motion.span 
                                        key={op} 
                                        className="px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                      >
                                        {op}
                                      </motion.span>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <motion.div 
                              className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Operation Distribution
                              </h4>
                              <div className="space-y-3">
                                {Object.entries(analysisResult.operations).map(([op, count], i) => (
                                  <motion.div
                                    key={op}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                  >
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-slate-400 capitalize">{op}</span>
                                      <span className="text-emerald-400 font-mono">{count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(count / 15) * 100}%` }}
                                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                      />
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>

                            <motion.div 
                              className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Collections Found
                              </h4>
                              <div className="flex flex-wrap gap-2 mb-6">
                                {analysisResult.collections.map((col, i) => (
                                  <motion.span
                                    key={col}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    whileHover={{ scale: 1.1 }}
                                    className="px-3 py-1.5 rounded-full text-sm bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                                  >
                                    {col}
                                  </motion.span>
                                ))}
                              </div>

                              <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                                <FileCode className="h-4 w-4" />
                                MongoDB Files
                              </h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {analysisResult.files.filter(f => f.mongoOperations && f.mongoOperations.length > 0).map((file, i) => (
                                  <motion.div
                                    key={file.path}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    className="flex items-center justify-between text-sm p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors"
                                  >
                                    <span className="text-slate-400 truncate">{file.name}</span>
                                    <div className="flex gap-1">
                                      {file.mongoOperations.slice(0, 2).map(op => (
                                        <span key={op} className="px-1.5 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-400">
                                          {op}
                                        </span>
                                      ))}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm">
                  <CardHeader className="border-b border-emerald-500/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-emerald-400">
                        Real-time Data Flow Visualization
                      </CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Speed:</span>
                          <Select value={flowSpeed} onValueChange={(v) => setFlowSpeed(v as typeof flowSpeed)}>
                            <SelectTrigger className="w-24 h-8 text-xs border-emerald-500/30 bg-[#0d1117]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-emerald-500/30 bg-[#161b22]">
                              <SelectItem value="slow">Slow</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="fast">Fast</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLiveMetrics(!showLiveMetrics)}
                          className={showLiveMetrics ? "text-emerald-400" : "text-slate-400"}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Metrics
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <AnimatePresence>
                      {showLiveMetrics && isLoading && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 grid grid-cols-4 gap-4"
                        >
                          {[
                            { label: "Req/sec", value: liveMetrics.requestsPerSec.toFixed(1), icon: <Activity className="h-3 w-3" /> },
                            { label: "Latency", value: `${liveMetrics.avgLatency.toFixed(0)}ms`, icon: <Timer className="h-3 w-3" /> },
                            { label: "Connections", value: liveMetrics.activeConnections, icon: <GitBranch className="h-3 w-3" /> },
                            { label: "Data", value: `${(liveMetrics.dataTransferred / 1024).toFixed(1)}KB`, icon: <HardDrive className="h-3 w-3" /> },
                          ].map((metric, i) => (
                            <motion.div
                              key={metric.label}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3"
                            >
                              <div className="flex items-center gap-1 text-xs text-cyan-400 mb-1">
                                {metric.icon}
                                {metric.label}
                              </div>
                              <motion.p 
                                className="font-mono text-lg text-cyan-300"
                                key={metric.value}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                              >
                                {metric.value}
                              </motion.p>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
                      {flowSteps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-4">
                          <motion.div
                            className={`relative rounded-xl border-2 p-6 transition-all ${
                              step.status === "idle"
                                ? "border-slate-700 bg-[#0d1117]"
                                : step.status === "active"
                                ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                                : step.status === "completed"
                                ? "border-emerald-500 bg-emerald-500/20"
                                : "border-red-500 bg-red-500/10"
                            }`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            <PulseRing active={step.status === "active"} />
                            <motion.div
                              className={`mb-2 flex justify-center ${
                                step.status === "idle"
                                  ? "text-slate-500"
                                  : step.status === "error"
                                  ? "text-red-400"
                                  : "text-emerald-400"
                              }`}
                              animate={step.status === "active" ? { rotate: 360 } : {}}
                              transition={{ duration: 1, repeat: step.status === "active" ? Infinity : 0, ease: "linear" }}
                            >
                              {step.status === "active" ? (
                                <Loader2 className="h-6 w-6" />
                              ) : step.status === "completed" ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500 }}
                                >
                                  <Check className="h-6 w-6" />
                                </motion.div>
                              ) : step.status === "error" ? (
                                <X className="h-6 w-6" />
                              ) : (
                                step.icon
                              )}
                            </motion.div>
                            <div className="text-center">
                              <p
                                className={`font-medium ${
                                  step.status === "idle"
                                    ? "text-slate-400"
                                    : step.status === "error"
                                    ? "text-red-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {step.label}
                              </p>
                              <AnimatePresence mode="wait">
                                {step.details && (
                                  <motion.p 
                                    key={step.details}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-1 text-xs text-slate-500"
                                  >
                                    {step.details}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                          {index < flowSteps.length - 1 && (
                            <div className="relative hidden lg:block w-8">
                              <ChevronRight className="h-6 w-6 text-slate-600" />
                              {(step.status === "completed" || step.status === "active") && (
                                <motion.div
                                  className="absolute inset-0 flex items-center justify-center"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: [0, 5, 0] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  <ChevronRight className="h-6 w-6 text-emerald-400" />
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 grid gap-4 lg:grid-cols-2">
                      <motion.div 
                        className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4"
                        whileHover={{ borderColor: "rgba(16, 185, 129, 0.4)" }}
                      >
                        <h3 className="mb-3 flex items-center gap-2 font-medium text-emerald-400">
                          {OPERATION_ICONS[operation]}
                          Current Operation: {operation.toUpperCase()}
                        </h3>
                        <pre className="max-h-40 overflow-auto font-mono text-xs text-slate-400">
                          {jsonInput}
                        </pre>
                      </motion.div>
                      <motion.div 
                        className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4"
                        whileHover={{ borderColor: "rgba(16, 185, 129, 0.4)" }}
                      >
                        <h3 className="mb-3 font-medium text-emerald-400">
                          Operation Details
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-400">
                          <li className="flex items-center gap-2">
                            <motion.span 
                              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            API Endpoint: <code className="text-emerald-300">/api/{operation}</code>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Method: <code className="text-emerald-300">POST</code>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Collection: <code className="text-emerald-300">demo_collection</code>
                          </li>
                        </ul>
                      </motion.div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={executeOperation}
                          disabled={isLoading}
                          size="lg"
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-5 w-5" />
                              Execute & Visualize Flow
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="learning" className="space-y-6">
              <motion.div 
                className="grid gap-6 lg:grid-cols-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  className="lg:col-span-4"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm sticky top-24">
                    <CardHeader className="border-b border-emerald-500/10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Lessons
                        </CardTitle>
                        <motion.div 
                          className="flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Trophy className="h-4 w-4 text-amber-400" />
                          <span className="text-sm text-slate-400">
                            {completedLessons.size}/{LESSONS.length}
                          </span>
                        </motion.div>
                      </div>
                      <div className="mt-3">
                        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                          <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400/50 to-transparent rounded-full"
                            animate={{ 
                              x: ["0%", "100%"],
                              opacity: [0, 1, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            style={{ width: "30%" }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {Math.round(progressPercentage)}% complete
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 max-h-[60vh] overflow-y-auto">
                      <div className="space-y-4">
                        {[
                          { title: "Beginner", lessons: beginnerLessons, color: "emerald" },
                          { title: "Intermediate", lessons: intermediateLessons, color: "amber" },
                          { title: "Advanced", lessons: advancedLessons, color: "rose" },
                        ].map((section, sectionIndex) => (
                          <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sectionIndex * 0.1 }}
                          >
                            <h4 className={`text-xs font-semibold uppercase tracking-wider text-${section.color}-400 mb-2`}>
                              {section.title}
                            </h4>
                            <div className="space-y-1">
                              {section.lessons.map((lesson, lessonIndex) => (
                                <motion.button
                                  key={lesson.id}
                                  onClick={() => loadLesson(lesson)}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: sectionIndex * 0.1 + lessonIndex * 0.05 }}
                                  whileHover={{ x: 4, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                                    selectedLesson?.id === lesson.id
                                      ? `bg-${section.color}-500/20 text-${section.color}-400`
                                      : "text-slate-400"
                                  }`}
                                >
                                  <motion.div
                                    animate={completedLessons.has(lesson.id) ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {completedLessons.has(lesson.id) ? (
                                      <CheckCircle2 className={`h-4 w-4 text-${section.color}-400 flex-shrink-0`} />
                                    ) : (
                                      <Circle className="h-4 w-4 text-slate-600 flex-shrink-0" />
                                    )}
                                  </motion.div>
                                  <span className="truncate">{lesson.title}</span>
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div 
                  className="lg:col-span-8 space-y-6"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  <AnimatePresence mode="wait">
                    {!selectedLesson ? (
                      <motion.div
                        key="welcome"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm overflow-hidden">
                          <CardContent className="py-16 relative">
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"
                              animate={{ opacity: [0.3, 0.5, 0.3] }}
                              transition={{ duration: 4, repeat: Infinity }}
                            />
                            <div className="text-center relative">
                              <motion.div 
                                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-6"
                                animate={{ 
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 5, -5, 0]
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                              >
                                <GraduationCap className="h-10 w-10 text-emerald-400" />
                              </motion.div>
                              <motion.h2 
                                className="text-2xl font-semibold text-emerald-400 mb-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                              >
                                Welcome to MongoDB Learning
                              </motion.h2>
                              <motion.p 
                                className="text-slate-400 max-w-md mx-auto mb-8"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                              >
                                Select a lesson from the sidebar to start learning MongoDB operations
                                through interactive, hands-on tutorials.
                              </motion.p>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  onClick={() => loadLesson(LESSONS[0])}
                                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                                >
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Start First Lesson
                                </Button>
                              </motion.div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={selectedLesson.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm overflow-hidden">
                          <CardHeader className="border-b border-emerald-500/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <motion.div 
                                  className="flex items-center gap-2 mb-1"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                >
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[selectedLesson.category]}`}>
                                    {selectedLesson.category}
                                  </span>
                                  {completedLessons.has(selectedLesson.id) && (
                                    <motion.span 
                                      className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring" }}
                                    >
                                      Completed
                                    </motion.span>
                                  )}
                                </motion.div>
                                <CardTitle className="text-xl text-emerald-400">
                                  {selectedLesson.title}
                                </CardTitle>
                              </div>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={tryInPlayground}
                                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                >
                                  Try in Playground
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-6">
                            <motion.div 
                              className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <Target className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="text-sm font-medium text-emerald-400 mb-1">Learning Objective</h4>
                                <p className="text-sm text-slate-300">{selectedLesson.objective}</p>
                              </div>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <h4 className="text-sm font-medium text-slate-300 mb-2">Explanation</h4>
                              <p className="text-sm text-slate-400 leading-relaxed">
                                {selectedLesson.explanation}
                              </p>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-slate-300">Sample Data / Query</h4>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {selectedLesson.operation.toUpperCase()}
                                </span>
                              </div>
                              <div className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4 overflow-hidden">
                                <pre className="font-mono text-sm text-emerald-300 overflow-x-auto">
                                  {JSON.stringify(selectedLesson.sampleData, null, 2)}
                                </pre>
                              </div>
                            </motion.div>

                            <motion.div 
                              className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <Lightbulb className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="text-sm font-medium text-amber-400 mb-1">Expected Result</h4>
                                <p className="text-sm text-slate-300">{selectedLesson.expectedResult}</p>
                              </div>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              <button
                                onClick={() => setShowTip(!showTip)}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                              >
                                <motion.div
                                  animate={{ rotate: showTip ? 90 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </motion.div>
                                Pro Tips ({selectedLesson.tips.length})
                              </button>
                              <AnimatePresence>
                                {showTip && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <ul className="mt-3 space-y-2 pl-6">
                                      {selectedLesson.tips.map((tip, i) => (
                                        <motion.li 
                                          key={i} 
                                          className="text-sm text-slate-400 flex items-start gap-2"
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: i * 0.1 }}
                                        >
                                          <span className="text-teal-400 mt-1">•</span>
                                          {tip}
                                        </motion.li>
                                      ))}
                                    </ul>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          </CardContent>
                        </Card>

                        <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm">
                          <CardHeader className="border-b border-emerald-500/10 pb-4">
                            <CardTitle className="text-lg text-emerald-400">
                              Try It Now
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="mb-4">
                              <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="h-40 w-full rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4 font-mono text-sm text-slate-100 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                              />
                            </div>
                            <div className="flex gap-3">
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                  onClick={() => loadLesson(selectedLesson)}
                                  variant="outline"
                                  className="border-slate-600 text-slate-400 hover:bg-slate-800"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Reset
                                </Button>
                              </motion.div>
                              <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                <Button
                                  onClick={executeOperation}
                                  disabled={isLoading}
                                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Executing...
                                    </>
                                  ) : (
                                    <>
                                      <Play className="mr-2 h-4 w-4" />
                                      Execute & Learn
                                    </>
                                  )}
                                </Button>
                              </motion.div>
                            </div>

                            <AnimatePresence mode="wait">
                              {error && (
                                <motion.div
                                  key="error"
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4"
                                >
                                  <div className="flex items-center gap-2 text-red-400">
                                    <X className="h-5 w-5" />
                                    <span className="font-medium">Error</span>
                                  </div>
                                  <p className="mt-1 text-sm text-red-300">{error}</p>
                                </motion.div>
                              )}

                              {result && (
                                <motion.div
                                  key="result"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-4 space-y-4"
                                >
                                  <motion.div 
                                    className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                  >
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", delay: 0.2 }}
                                    >
                                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    </motion.div>
                                    <span className="text-sm text-emerald-400 font-medium">
                                      Operation completed successfully!
                                    </span>
                                  </motion.div>

                                  {result.metrics && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <motion.div 
                                        className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-3"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                      >
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                          <Clock className="h-3 w-3" />
                                          Execution Time
                                        </div>
                                        <p className="mt-1 font-mono text-lg text-emerald-400">
                                          {(result.metrics as Record<string, unknown>).executionTime}ms
                                        </p>
                                      </motion.div>
                                      <motion.div 
                                        className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-3"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                      >
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                          <Zap className="h-3 w-3" />
                                          Operation
                                        </div>
                                        <p className="mt-1 font-mono text-lg text-emerald-400">
                                          {(result.metrics as Record<string, unknown>).operation as string}
                                        </p>
                                      </motion.div>
                                    </div>
                                  )}

                                  <motion.div 
                                    className="rounded-lg border border-emerald-500/20 bg-[#0d1117] p-4"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                  >
                                    <div className="mb-2 text-xs text-slate-400">Response Data</div>
                                    <pre className="max-h-48 overflow-auto font-mono text-xs text-slate-300">
                                      {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                  </motion.div>

                                  {selectedLesson.nextLesson && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.4 }}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Button
                                        onClick={() => {
                                          const next = LESSONS.find(l => l.id === selectedLesson.nextLesson);
                                          if (next) loadLesson(next);
                                        }}
                                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25"
                                      >
                                        Next Lesson
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                      </Button>
                                    </motion.div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              <motion.div 
                className="grid gap-6 lg:grid-cols-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="lg:col-span-8 space-y-6">
                  <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-emerald-500/10">
                      <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Query Performance Log
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {performanceLog.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                            <History className="h-10 w-10 mb-2 opacity-20" />
                            <p>No queries recorded yet</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                                <tr>
                                  <th className="px-4 py-3 font-medium">Time</th>
                                  <th className="px-4 py-3 font-medium">Operation</th>
                                  <th className="px-4 py-3 font-medium">Latency</th>
                                  <th className="px-4 py-3 font-medium">Examined</th>
                                  <th className="px-4 py-3 font-medium">Index</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {performanceLog.map((entry, i) => (
                                  <motion.tr 
                                    key={entry.timestamp}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="hover:bg-slate-800/30 transition-colors"
                                  >
                                    <td className="px-4 py-3 text-slate-500 font-mono">
                                      {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-emerald-400 capitalize">
                                      {entry.operation}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`font-mono ${entry.executionTime > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {entry.executionTime}ms
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 font-mono">
                                      {entry.documentsExamined ?? '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${entry.indexUsed === 'COLLSCAN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                        {entry.indexUsed || 'N/A'}
                                      </span>
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-emerald-500/10">
                      <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Collection Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {collStats ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-6">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">Document Count</span>
                                <span className="text-emerald-400 font-mono">{collStats.documentCount}</span>
                              </div>
                              <Progress value={Math.min((collStats.documentCount / 1000) * 100, 100)} className="h-2 bg-slate-800" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">Storage Size</span>
                                <span className="text-emerald-400 font-mono">{(collStats.storageSize / 1024).toFixed(2)} KB</span>
                              </div>
                              <Progress value={Math.min((collStats.storageSize / (1024 * 100)) * 100, 100)} className="h-2 bg-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-[#0d1117] border border-emerald-500/10">
                                <p className="text-xs text-slate-500 mb-1">Avg Obj Size</p>
                                <p className="text-lg font-mono text-emerald-400">{collStats.avgObjSize} B</p>
                              </div>
                              <div className="p-4 rounded-lg bg-[#0d1117] border border-emerald-500/10">
                                <p className="text-xs text-slate-500 mb-1">Index Count</p>
                                <p className="text-lg font-mono text-emerald-400">{collStats.indexCount}</p>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-[#0d1117] p-4 border border-emerald-500/10">
                            <h4 className="text-sm font-medium text-emerald-400 mb-4 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Active Indexes
                            </h4>
                            <div className="space-y-3">
                              {collStats.indexes.map((idx, i) => (
                                <motion.div 
                                  key={idx.name}
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex items-center justify-between p-2 rounded bg-slate-800/50"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-slate-300">{idx.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      {JSON.stringify(idx.key).replace(/["{}]/g, '')}
                                    </p>
                                  </div>
                                  {idx.unique && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      Unique
                                    </span>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <Card className="border-emerald-500/20 bg-[#161b22]/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-emerald-500/10">
                      <CardTitle className="text-lg text-emerald-400">Performance Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                          <Zap className="h-4 w-4" />
                          <span className="text-sm font-medium">Health Status</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Your database is currently performing optimally. {performanceLog.filter(l => l.indexUsed === 'COLLSCAN').length > 0 ? "Some queries are using COLLSCAN which might be slow on larger datasets." : "No collection scans detected in recent queries."}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-300">Quick Actions</h4>
                        <div className="grid gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => {
                              setOperation("find");
                              setJsonInput("{}");
                              setActiveTab("playground");
                            }}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Test Query Performance
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => {
                              setOperation("aggregate");
                              setActiveTab("playground");
                            }}
                          >
                            <Braces className="h-4 w-4 mr-2" />
                            Analyze Aggregation
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
