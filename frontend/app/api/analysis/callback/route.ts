import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 1. Security Check: Ensure the request is coming from our own service
    const authorization = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.VERCEL_WEBHOOK_SECRET!}`

    if (authorization !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse the request body
    const body = await request.json()
    const { analysisId, results } = body

    if (!analysisId || !results) {
      return NextResponse.json({ error: 'Missing analysisId or results' }, { status: 400 })
    }

    // 3. Update the specific record in the 'audio_analysis' table
    const { data, error } = await supabaseAdmin
      .from('audio_analysis')
      .update({
        tempo: results.tempo,
        beat_count: results.beat_count,
        mfccs: results.mfccs,
        chroma_vector: results.chroma_vector,
        spectral_features: results.spectral_features,
        embedding: results.embedding,
        processing_status: results.processing_status,
        metadata: results.metadata || { error: results.error },
      })
      .eq('id', analysisId)
      .select()
      .single()

    if (error) {
      console.error('Error updating analysis record:', error)
      return NextResponse.json({ error: 'Failed to save analysis results' }, { status: 500 })
    }

    // 4. Log the completion for analytics
    if (results.processing_status === 'completed') {
      await supabaseAdmin
        .from('usage_logs')
        .insert({
          user_id: data.audio_file_id, // We'll need to get this from the audio_files table
          action: 'analysis_completed',
          details: {
            analysis_id: analysisId,
            tempo: results.tempo,
            beat_count: results.beat_count
          }
        })
    }

    console.log(`Successfully updated analysis for ID: ${analysisId}`)
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error in analysis callback:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}