export type ProcessingStatus = 'pending' | 'completed' | 'failed'

export interface SpectralFeatures {
  centroid: number[]
  bandwidth: number[]
  rolloff: number[]
  zcr: number[]
  rms: number[]
}

export interface AudioAnalysis {
  id: string
  audio_file_id: string
  tempo: number
  beat_count: number
  mfccs: number[][]
  spectral_features: SpectralFeatures
  chroma_vector: number[][]
  embedding: number[]
  processing_status: ProcessingStatus
  metadata?: { error?: string; summary?: string; duration?: number }
  created_at: string
}

export interface AudioFile {
  id: string
  user_id: string
  filename: string
  storage_path: string
  duration?: number
  sample_rate?: number
  channels?: number
  bitrate?: number
  format?: string
  file_size?: number
  tags?: string[]
  created_at: string
}