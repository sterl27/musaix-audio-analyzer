'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useUploadStore } from '@/lib/store/useUploadStore'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadCloud, CheckCircle2, XCircle, Loader2, Music } from 'lucide-react'

export function AudioUploader() {
  const { uploads, addUploads, updateProgress, setStatus } = useUploadStore()

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
    <div>
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className={`transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`}>
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud className="h-8 w-8 text-white" />
          </div>
          {isDragActive ? (
            <div>
              <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Drop files here!</h3>
              <p className="text-gray-600 dark:text-gray-300">Release to start uploading</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Upload Your Audio Files</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Drag & drop your audio files here, or click to browse
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium hover:shadow-lg transition-shadow duration-300">
                Choose Files
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">MP3</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">WAV</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">FLAC</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">OGG</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">Up to 500MB</span>
          </div>
        </div>
      </div>
      
      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Progress</h3>
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-4 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/30"
              >
                <div className="flex-shrink-0">
                  {upload.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {upload.status === 'processing' && (
                    <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
                  )}
                  {upload.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {upload.file.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(upload.file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    <p className="text-xs font-medium capitalize text-gray-600 dark:text-gray-300">
                      {upload.status === 'uploading' && `${upload.progress}%`}
                      {upload.status === 'processing' && 'Analyzing...'}
                      {upload.status === 'success' && 'Complete'}
                      {upload.status === 'error' && 'Failed'}
                    </p>
                  </div>
                  
                  {upload.status === 'uploading' && (
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {upload.status === 'error' && upload.error && (
                    <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}