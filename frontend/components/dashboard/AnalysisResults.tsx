'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AudioAnalysis } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2, Music } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AnalysisResultsProps {
  analysisId: string
  initialAnalysisData?: AudioAnalysis
}

export function AnalysisResults({ analysisId, initialAnalysisData }: AnalysisResultsProps) {
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(initialAnalysisData || null)
  const [loading, setLoading] = useState(!initialAnalysisData)

  // This useEffect hook is the core of the real-time functionality
  useEffect(() => {
    // Fetch initial data if not provided
    if (!initialAnalysisData) {
      fetchAnalysis()
    }

    // If the analysis is already complete, no need to subscribe
    if (analysis?.processing_status === 'completed') {
      return
    }

    // Create a subscription to the 'audio_analysis' table
    const channel = supabase
      .channel(`realtime:analysis:${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'audio_analysis',
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          console.log('Real-time update received!', payload.new)
          setAnalysis(payload.new as AudioAnalysis)
        }
      )
      .subscribe()

    // Cleanup: Unsubscribe from the channel when the component unmounts
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, analysisId, analysis?.processing_status, initialAnalysisData])

  async function fetchAnalysis() {
    try {
      const { data, error } = await supabase
        .from('audio_analysis')
        .select('*')
        .eq('id', analysisId)
        .single()

      if (error) throw error
      setAnalysis(data)
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground" />
        <CardTitle>Loading Analysis</CardTitle>
        <CardDescription>Fetching your audio analysis data...</CardDescription>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Analysis Not Found</AlertTitle>
        <AlertDescription>Could not find the audio analysis with ID: {analysisId}</AlertDescription>
      </Alert>
    )
  }

  // Display a loading state while processing
  if (analysis.processing_status === 'pending') {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Music className="h-8 w-8 mr-2 text-primary animate-pulse" />
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <CardTitle>Analysis in Progress</CardTitle>
        <CardDescription>
          We're analyzing your audio file using AI. This page will update automatically when complete.
        </CardDescription>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>⏳ Extracting musical features...</p>
          <p>🤖 Generating AI embeddings...</p>
          <p>📊 Preparing visualizations...</p>
        </div>
      </Card>
    )
  }

  // Display an error state if processing failed
  if (analysis.processing_status === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Analysis Failed</AlertTitle>
        <AlertDescription>{analysis.metadata?.error || 'An unknown error occurred during processing.'}</AlertDescription>
      </Alert>
    )
  }

  // Format spectral data for the Recharts chart
  const chartData = analysis.spectral_features?.centroid?.slice(0, 100).map((value, index) => ({
    time: index,
    centroid: parseFloat(value.toFixed(2)),
    bandwidth: analysis.spectral_features.bandwidth?.[index]?.toFixed(2) || 0,
  })) || []

  // Display the completed results
  return (
    <div className="space-y-6">
      {/* Success indicator */}
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Analysis Complete</span>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tempo</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">
            {Math.round(analysis.tempo)} 
            <span className="text-lg font-normal text-muted-foreground ml-2">BPM</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Detected Beats</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">{analysis.beat_count}</CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Duration</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">
            {analysis.metadata?.duration ? `${analysis.metadata.duration.toFixed(1)}s` : 'N/A'}
          </CardContent>
        </Card>
      </div>

      {/* Spectral analysis visualization */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spectral Analysis</CardTitle>
            <CardDescription>
              Spectral centroid represents the "brightness" of the sound over time, while bandwidth shows the spread of frequencies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Time Frame', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  labelFormatter={(value) => `Frame: ${value}`}
                  formatter={(value, name) => [value, name === 'centroid' ? 'Centroid' : 'Bandwidth']}
                />
                <Line 
                  type="monotone" 
                  dataKey="centroid" 
                  stroke="#8884d8" 
                  dot={false}
                  name="Spectral Centroid"
                />
                <Line 
                  type="monotone" 
                  dataKey="bandwidth" 
                  stroke="#82ca9d" 
                  dot={false}
                  name="Spectral Bandwidth"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {analysis.metadata?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis Summary</CardTitle>
            <CardDescription>Generated musical description used for vector embeddings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis.metadata.summary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}