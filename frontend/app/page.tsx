export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🎵 Musaix Audio Analyzer
        </h1>
      </div>
      
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Upload Audio
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Drag & drop your audio files for AI-powered analysis
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Vector Search
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Find similar tracks using pgvector similarity search
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Real-time Analysis
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Watch your audio being processed live with WebSocket updates
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            AI Insights
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Get intelligent insights powered by OpenAI embeddings
          </p>
        </div>
      </div>
    </main>
  )
}