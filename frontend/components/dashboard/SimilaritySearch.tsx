'use client'

import { useState } from 'react'
import { findSimilarFiles, type SimilarAudioFile } from '@/app/actions/similarity'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Music, Play } from 'lucide-react'

interface SimilaritySearchProps {
  sourceEmbedding?: number[]
  sourceFileName?: string
}

export function SimilaritySearch({ sourceEmbedding, sourceFileName }: SimilaritySearchProps) {
  const [similarFiles, setSimilarFiles] = useState<SimilarAudioFile[]>([])
  const [loading, setLoading] = useState(false)
  const [threshold, setThreshold] = useState(0.78)

  const handleSearch = async () => {
    if (!sourceEmbedding || sourceEmbedding.length === 0) {
      return
    }

    setLoading(true)
    try {
      const results = await findSimilarFiles(sourceEmbedding, threshold, 10)
      setSimilarFiles(results)
    } catch (error) {
      console.error('Similarity search failed:', error)
      // TODO: Add proper error handling/toast
    } finally {
      setLoading(false)
    }
  }

  const formatSimilarity = (distance: number) => {
    // Convert cosine distance back to similarity percentage
    const similarity = (1 - distance) * 100
    return `${similarity.toFixed(1)}%`
  }

  if (!sourceEmbedding || !sourceFileName) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-200 to-pink-300 dark:from-purple-600 dark:to-pink-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-purple-600 dark:text-purple-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Source Audio</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Complete an audio analysis to discover similar tracks
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Similar Audio Files
        </CardTitle>
        <CardDescription>
          Find tracks similar to "{sourceFileName}" using AI vector similarity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search controls */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="threshold" className="text-sm text-muted-foreground">
              Similarity Threshold: {(threshold * 100).toFixed(0)}%
            </label>
            <input
              id="threshold"
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-32"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Find Similar
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {similarFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Found {similarFiles.length} similar tracks
            </h4>
            {similarFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      Duration: {file.duration ? `${file.duration.toFixed(1)}s` : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">
                    {formatSimilarity(file.similarity)} match
                  </span>
                  <Button size="sm" variant="outline">
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {similarFiles.length === 0 && !loading && (
          <div className="text-center py-6 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Click "Find Similar" to discover tracks with similar musical characteristics</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}