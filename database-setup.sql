-- Musaix Audio Analyzer - Complete Database Setup
-- Run this in your Supabase SQL Editor

-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Audio files table - stores metadata about uploaded audio files
CREATE TABLE IF NOT EXISTS audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    duration FLOAT,
    sample_rate INTEGER,
    channels INTEGER,
    bitrate INTEGER,
    format TEXT,
    file_size BIGINT,
    tags TEXT[], -- User-defined tags for filtering
    is_reference_track BOOLEAN DEFAULT false,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio analysis results table - stores the extracted features and AI embeddings
CREATE TABLE IF NOT EXISTS audio_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_file_id UUID REFERENCES audio_files ON DELETE CASCADE,
    tempo FLOAT,
    beat_count INTEGER,
    audio_key TEXT, -- Musical key (C, D, etc.)
    mfccs JSONB,
    spectral_features JSONB,
    chroma_vector JSONB, -- Tonal content
    energy_curve JSONB, -- Energy over time
    metadata JSONB,
    embedding vector(1536), -- pgvector column for OpenAI text-embedding-3-large
    processing_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists table for organizing audio collections
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist items (many-to-many relationship)
CREATE TABLE IF NOT EXISTS playlist_items (
    playlist_id UUID REFERENCES playlists ON DELETE CASCADE,
    audio_file_id UUID REFERENCES audio_files ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (playlist_id, audio_file_id)
);

-- Usage analytics table for tracking user actions
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    action TEXT NOT NULL, -- upload, analyze, search, chat, etc.
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector similarity indexes for performance
-- IVFFlat index for general similarity search (good for smaller datasets)
CREATE INDEX IF NOT EXISTS audio_embedding_ivfflat_idx ON audio_analysis
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- HNSW index for high-performance similarity search (better for larger datasets)  
CREATE INDEX IF NOT EXISTS audio_embedding_hnsw_idx ON audio_analysis
USING hnsw (embedding vector_cosine_ops);

-- Additional indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_tags ON audio_files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_status ON audio_analysis(processing_status);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_action ON usage_logs(user_id, action, created_at);

-- Enable Row-Level Security (RLS) on all tables
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_files table
CREATE POLICY IF NOT EXISTS "Users view own files" ON audio_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users insert own files" ON audio_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users update own files" ON audio_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users delete own files" ON audio_files
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for audio_analysis table
CREATE POLICY IF NOT EXISTS "Users view own analysis" ON audio_analysis
    FOR SELECT USING (
        audio_file_id IN (SELECT id FROM audio_files WHERE user_id = auth.uid())
    );

CREATE POLICY IF NOT EXISTS "Users insert analysis" ON audio_analysis
    FOR INSERT WITH CHECK (
        audio_file_id IN (SELECT id FROM audio_files WHERE user_id = auth.uid())
    );

CREATE POLICY IF NOT EXISTS "Users update analysis" ON audio_analysis
    FOR UPDATE USING (
        audio_file_id IN (SELECT id FROM audio_files WHERE user_id = auth.uid())
    );

-- RLS Policies for playlists table
CREATE POLICY IF NOT EXISTS "Users view own playlists" ON playlists
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY IF NOT EXISTS "Users manage own playlists" ON playlists
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for playlist_items table
CREATE POLICY IF NOT EXISTS "Users view playlist items" ON playlist_items
    FOR SELECT USING (
        playlist_id IN (
            SELECT id FROM playlists 
            WHERE user_id = auth.uid() OR is_public = true
        )
    );

CREATE POLICY IF NOT EXISTS "Users manage own playlist items" ON playlist_items
    FOR ALL USING (
        playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid())
    );

-- RLS Policies for usage_logs table
CREATE POLICY IF NOT EXISTS "Users view own usage logs" ON usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users insert own usage logs" ON usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_audio_files (
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id uuid,
    filename text,
    storage_path text,
    duration float,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        af.id,
        af.filename,
        af.storage_path,
        af.duration,
        aa.embedding <=> query_embedding AS similarity
    FROM
        audio_analysis AS aa
    JOIN
        audio_files AS af ON aa.audio_file_id = af.id
    WHERE
        aa.embedding <=> query_embedding < match_threshold
        AND aa.processing_status = 'completed'
    ORDER BY
        similarity ASC
    LIMIT
        match_count;
$$;

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files', 
    false,
    false,
    524288000, -- 500MB limit
    ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg']::text[]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio files bucket
CREATE POLICY IF NOT EXISTS "Users can upload audio files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY IF NOT EXISTS "Users can view own audio files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audio-files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY IF NOT EXISTS "Users can delete own audio files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audio-files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Success message
SELECT 'Musaix Audio Analyzer database setup complete! 🎵' AS message;