import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Headphones, Music } from 'lucide-react'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl group">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:-translate-x-1 transition-transform duration-200" />
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🎵</span>
            </div>
            <span className="gradient-text">Musaix</span>
          </Link>
          <Link href="/dashboard">
            <Button className="gradient-button text-sm sm:text-base">
              Try It Now
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-4xl mx-auto animate-in fade-in-50 slide-in-from-bottom-8 duration-700">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 shadow-xl">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Interactive Demo
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 sm:mb-6 leading-tight text-balance">
            <span className="gradient-text">See Musaix</span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              In Action
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Experience how our AI analyzes audio files, extracts features, and finds similar tracks with unprecedented accuracy.
          </p>
        </div>

        {/* Demo Video Placeholder */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 animate-in fade-in-50 slide-in-from-bottom-8 duration-700 delay-300">
          <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center group cursor-pointer">
              {/* Play Button */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition-all duration-300">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-glow">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-gray-800 ml-1" fill="currentColor" />
                </div>
              </div>

              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-r from-blue-500/30 to-purple-500/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-32 h-32 sm:w-48 sm:h-48 text-white/30" />
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-4 sm:mt-6">
            Click to watch a 2-minute demo of Musaix analyzing real audio files
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto px-4 sm:px-6 animate-in fade-in-50 duration-700 delay-500">
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Headphones className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">Real Audio Analysis</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Watch live feature extraction from actual music files</p>
          </div>

          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">AI Embeddings</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">See how we convert audio into searchable vectors</p>
          </div>

          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">Similar Track Discovery</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Experience instant similarity search in action</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 sm:mt-16 text-center animate-in fade-in-50 duration-700 delay-700">
          <Link href="/dashboard">
            <Button size="lg" className="gradient-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
              Start Your Own Analysis
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}