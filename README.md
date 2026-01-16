# MongoFlow Studio

Interactive MongoDB visualization and learning platform built with Next.js 15.

![MongoFlow Studio](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## Features

- **Interactive Playground**: Execute MongoDB operations (insert, find, update, delete, aggregate) with real-time results
- **Data Flow Visualization**: Watch data flow through your application architecture
- **Learning Mode**: Step-by-step MongoDB tutorials from beginner to advanced
- **Performance Monitoring**: Track query execution times, index usage, and collection statistics
- **GitHub Repo Analyzer**: Analyze any GitHub repository's MongoDB usage patterns

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- MongoDB Atlas account (or local MongoDB instance)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/mongoflow-studio.git
cd mongoflow-studio
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your MongoDB connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=mongoflow_demo
GITHUB_TOKEN=your_github_token_optional
```

5. Run the development server:
```bash
npm run dev
# or
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `DB_NAME` | Database name | Yes |
| `GITHUB_TOKEN` | GitHub personal access token for repo analysis | No |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insert` | POST | Insert a single document |
| `/api/bulk-insert` | POST | Insert multiple documents |
| `/api/find` | POST | Query documents |
| `/api/update` | POST | Update documents |
| `/api/delete` | POST | Delete documents |
| `/api/aggregate` | POST | Run aggregation pipeline |
| `/api/stats` | GET | Get collection statistics |
| `/api/reset` | POST | Reset the demo collection |
| `/api/create-index` | POST | Create an index |
| `/api/analyze-github` | POST | Analyze GitHub repo for MongoDB usage |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main page
├── components/
│   └── ui/            # UI components
└── lib/
    ├── mongodb.ts     # MongoDB connection
    └── utils.ts       # Utility functions
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build the production version:
```bash
npm run build
npm start
```

## License

MIT
