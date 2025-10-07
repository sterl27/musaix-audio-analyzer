'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Define the structure of the returned audio file data
export interface SimilarAudioFile {
  id: string
  filename: string
  storage_path: string
  duration: number
  similarity: number // The distance score from the query
}

/**
 * Finds similar audio files based on a vector embedding.
 * @param embedding The 1536-dimensional vector of the source audio file.
 * @param matchThreshold The similarity threshold (e.g., 0.78 for cosine similarity).
 * @param matchCount The maximum number of similar files to return.
 * @returns A promise that resolves to an array of similar audio files.
 */
export async function findSimilarFiles(
  embedding: number[],
  matchThreshold: number = 0.78, // Cosine distance is 1 - similarity, so a lower distance is better. Let's aim for distance < 0.22
  matchCount: number = 10
): Promise<SimilarAudioFile[]> {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Validate the input embedding
  if (!embedding || embedding.length !== 1536) {
    throw new Error('Invalid embedding vector provided.')
  }

  // Use an RPC (Remote Procedure Call) to call a PostgreSQL function
  // This is the recommended way to handle vector searches for security and performance.
  const { data, error } = await supabase.rpc('match_audio_files', {
    query_embedding: embedding,
    match_threshold: 1 - matchThreshold, // We pass the distance to the function
    match_count: matchCount,
  })

  if (error) {
    console.error('Error finding similar files:', error)
    throw new Error('Could not perform similarity search.')
  }

  return data as SimilarAudioFile[]
}

/**
 * Gets analysis results for a specific audio file by ID
 */
export async function getAnalysisById(analysisId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('audio_analysis')
    .select(`
      *,
      audio_files (
        id,
        filename,
        storage_path,
        duration,
        file_size,
        format,
        created_at
      )
    `)
    .eq('id', analysisId)
    .single()

  if (error) {
    console.error('Error fetching analysis:', error)
    throw new Error('Could not fetch analysis data.')
  }

  return data
}

/**
 * Gets all completed analyses for the current user
 */
export async function getUserAnalyses() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('audio_analysis')
    .select(`
      *,
      audio_files (
        id,
        filename,
        storage_path,
        duration,
        file_size,
        format,
        created_at
      )
    `)
    .eq('processing_status', 'completed')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user analyses:', error)
    throw new Error('Could not fetch user analyses.')
  }

  return data
}

/**
 * Searches audio files by filename or tags
 */
export async function searchAudioFiles(searchQuery: string, limitCount: number = 10) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.rpc('search_audio_files', {
    search_query: searchQuery,
    limit_count: limitCount
  })

  if (error) {
    console.error('Error searching audio files:', error)
    throw new Error('Could not search audio files.')
  }

  return data
}