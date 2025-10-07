import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Define the expected structure of the webhook payload from Supabase Storage
interface StorageWebhookPayload {
  type: 'INSERT'
  table: 'objects'
  record: {
    id: string
    name: string
    owner: string
    bucket_id: string
    metadata: {
      mimetype: string
      size: number
    }
  }
}

serve(async (req) => {
  try {
    // 1. Create Supabase client with the service role key for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 2. Parse the incoming request body from the Storage webhook
    const payload: StorageWebhookPayload = await req.json()
    const { record: fileRecord } = payload

    // 3. Validate that this is an audio file upload to the correct bucket
    if (fileRecord.bucket_id !== 'audio-files') {
      return new Response(JSON.stringify({ message: 'Not an audio file upload' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 4. Extract audio metadata from the file
    const audioMetadata = extractAudioMetadata(fileRecord)

    // 5. Insert a new record into the public 'audio_files' table
    const { data: audioFileData, error: audioFileError } = await supabaseAdmin
      .from('audio_files')
      .insert({
        user_id: fileRecord.owner,
        filename: fileRecord.name,
        storage_path: fileRecord.name,
        file_size: fileRecord.metadata.size,
        format: fileRecord.metadata.mimetype,
        ...audioMetadata
      })
      .select()
      .single()

    if (audioFileError || !audioFileData) {
      console.error('Error inserting into audio_files:', audioFileError)
      return new Response(JSON.stringify({ error: 'Failed to create audio file record' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 6. Create an initial 'pending' record in the 'audio_analysis' table
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from('audio_analysis')
      .insert({
        audio_file_id: audioFileData.id,
        processing_status: 'pending',
      })
      .select()
      .single()

    if (analysisError || !analysisData) {
      console.error('Error creating pending analysis record:', analysisError)
      return new Response(JSON.stringify({ error: 'Failed to create analysis record' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 7. Invoke the Vercel Serverless Function to start the actual analysis
    const vercelFunctionUrl = Deno.env.get('VERCEL_ANALYSIS_FUNCTION_URL')!
    const webhookSecret = Deno.env.get('VERCEL_WEBHOOK_SECRET')!

    // Fire and forget - we don't wait for the analysis to complete
    fetch(vercelFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify({
        storagePath: audioFileData.storage_path,
        analysisId: analysisData.id,
      }),
    }).catch(error => {
      console.error('Failed to trigger analysis:', error)
    })

    // 8. Log the upload action for analytics
    await supabaseAdmin
      .from('usage_logs')
      .insert({
        user_id: fileRecord.owner,
        action: 'upload',
        details: {
          filename: fileRecord.name,
          file_size: fileRecord.metadata.size,
          analysis_id: analysisData.id
        }
      })

    // 9. Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      analysisId: analysisData.id,
      audioFileId: audioFileData.id 
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in process-audio function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

function extractAudioMetadata(fileRecord: any) {
  // Extract basic metadata from filename and MIME type
  const { name, metadata } = fileRecord
  const extension = name.split('.').pop()?.toLowerCase()
  
  // Set default values based on common audio formats
  let estimatedBitrate = 128000 // Default bitrate
  let channels = 2 // Default stereo
  
  switch (metadata.mimetype) {
    case 'audio/mpeg':
    case 'audio/mp3':
      estimatedBitrate = 320000 // High quality MP3
      break
    case 'audio/wav':
    case 'audio/wave':
      estimatedBitrate = 1411000 // CD quality WAV
      break
    case 'audio/flac':
      estimatedBitrate = 1000000 // FLAC average
      break
    case 'audio/ogg':
      estimatedBitrate = 256000 // High quality OGG
      break
  }

  return {
    bitrate: estimatedBitrate,
    channels: channels,
    sample_rate: 44100, // Default CD quality sample rate
    // Duration and other precise metadata will be extracted during analysis
  }
}