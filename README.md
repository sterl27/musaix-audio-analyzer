# 🎵 Musaix Audio Analyzer

A production-ready AI-powered audio analysis platform built with Next.js 14, Supabase, and Vercel. Features real-time collaboration, vector similarity search, and enterprise-grade scalability.

## ✨ Key Features

- **Multi-Format Audio Upload**: Drag & drop MP3, WAV, FLAC, OGG files up to 500MB
- **AI-Powered Analysis**: Extract tempo, MFCCs, spectral features using Librosa
- **Vector Similarity Search**: Find similar tracks using pgvector with 1536-dimensional embeddings
- **Real-Time Processing**: Live updates via Supabase Realtime during analysis
- **Interactive Visualizations**: Charts and waveforms with Recharts and D3.js
- **Secure Authentication**: Supabase Auth with OAuth (Google, GitHub) and magic links
- **Scalable Architecture**: Event-driven serverless functions on Vercel

## 🏗️ Architecture

```
User Upload → Supabase Storage → Edge Function → Vercel Python → Database → Real-Time UI
```

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Recharts (visualizations)

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- pgvector (similarity search)
- Vercel Serverless Functions (Python + Librosa)

**AI/ML:**
- OpenAI text-embedding-3-large (1536-dimensional vectors)
- Librosa (audio feature extraction)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+ (for serverless functions)
- Supabase account
- Vercel account
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo-url>
cd musaix-audio-analyzer/frontend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. **Set up Supabase:**
```bash
# Install Supabase CLI
npm install -g supabase

# Run database migrations
cd ../supabase
supabase db push

# Deploy Edge Functions
supabase functions deploy process-audio
```

4. **Deploy to Vercel:**
```bash
cd ../frontend
npm install -g vercel
vercel --prod
```

## 📁 Project Structure

```
musaix-audio-analyzer/
├── frontend/               # Next.js application
│   ├── app/               # App Router pages
│   │   ├── (auth)/        # Authentication pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── api/          # API routes
│   │   └── actions/      # Server actions
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   └── audio/        # Audio player components
│   └── lib/              # Utilities and helpers
├── api/                  # Python serverless functions
│   ├── analyze.py        # Main analysis function
│   ├── index.py         # Vercel handler
│   └── requirements.txt  # Python dependencies
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge Functions (Deno)
└── README.md            # This file
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"

# OpenAI (Required)
OPENAI_API_KEY="sk-..."

# Security (Required)
VERCEL_WEBHOOK_SECRET="your-random-secret"

# App URLs (Auto-populated by Vercel)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
VERCEL_ANALYSIS_FUNCTION_URL="https://your-app.vercel.app/api"
```

### Supabase Setup

1. Create a new Supabase project
2. Enable pgvector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
3. Run the migrations from `supabase/migrations/`
4. Configure Storage bucket named `audio-files`
5. Set up webhook to trigger Edge Functions

### Database Schema

Key tables:
- `audio_files` - File metadata and storage paths
- `audio_analysis` - Analysis results with pgvector embeddings
- `playlists` - User-created collections
- `usage_logs` - Analytics and audit trail

## 🎯 How to Use

1. **Sign In**: Use email magic links or OAuth (Google/GitHub)
2. **Upload Audio**: Drag & drop files up to 500MB
3. **Real-Time Analysis**: Watch progress live with WebSocket updates
4. **Explore Results**: View tempo, spectral analysis, and AI insights
5. **Find Similar Tracks**: Use vector search to discover similar music
6. **Build Playlists**: Organize your analyzed audio files

## 🔐 Security Features

- **Row-Level Security (RLS)**: All database tables enforce user isolation
- **API Authentication**: Webhook secrets for service-to-service calls
- **File Validation**: MIME type and signature verification
- **Storage Quotas**: 5GB per user with automatic enforcement
- **Audit Logging**: Complete action history for compliance

## 📊 Performance

- **Vector Search**: <10ms with pgvector HNSW indexes
- **File Processing**: 3min song ~8 seconds analysis time
- **Real-Time Updates**: <100ms latency via Supabase Realtime
- **Global CDN**: Vercel Edge Network for <50ms response times

## 🧪 Development

### Local Development

```bash
# Start Next.js dev server
cd frontend
npm run dev

# Start Supabase locally
cd supabase
supabase start

# Test Edge Functions
supabase functions serve
```

### Testing

```bash
# Run frontend tests
npm test

# Run Python tests
cd api
pytest
```

## 🚀 Deployment

### Automatic Deployment

Push to main branch triggers:
1. Vercel builds and deploys frontend
2. GitHub Actions runs tests
3. Edge Functions auto-deploy to Supabase

### Manual Deployment

```bash
# Deploy frontend
vercel --prod

# Deploy Edge Functions
supabase functions deploy process-audio

# Run migrations
supabase db push
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://106-g59nl30yu-sterl27s-projects.vercel.app)
- [Supabase Dashboard](https://app.supabase.com/project/hzxtkewgywlxaqtckjrs)
- [Vercel Dashboard](https://vercel.com/sterl27s-projects/106)
- [GitHub Repository](https://github.com/sterl27/musaix-audio-analyzer)

## 🆘 Support

- 📧 Email: support@musaix.com
- 💬 GitHub Issues: [Report bugs](https://github.com/your-username/musaix-audio-analyzer/issues)
- 📖 Docs: [Full documentation](https://your-docs-site.com)

---

**Built with ⚡ by the Musaix Team**