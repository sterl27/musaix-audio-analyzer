'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useUploadStore } from '@/lib/store/useUploadStore'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadCloud } from 'lucide-react'

export function AudioUploader() {
  const { addUploads, updateProgress, setStatus } = useUploadStore()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      
      addUploads(acceptedFiles)

      // Process each file
      for (const file of acceptedFiles) {
        const fileId = `${file.name}-${file.size}`
        
        try {
          const { data, error } = await supabase.storage
            .from('audio-files')
            .upload(file.name, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type,
            })

          if (error) throw error
          
          // On success, the webhook takes over. We mark it as 'processing'.
          setStatus(fileId, 'processing')

        } catch (err: any) {
          console.error('Upload failed:', err)
          setStatus(fileId, 'error', err.message)
        }
      }
    },
    [addUploads, updateProgress, setStatus]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.flac', '.ogg'] },
    maxSize: 500 * 1024 * 1024, // 500MB limit
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Audio</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-border'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag & drop audio files here, or click to select</p>
          )}
          <p className="text-sm text-muted-foreground">MP3, WAV, FLAC, OGG up to 500MB</p>
        </div>
      </CardContent>
    </Card>
  )
}