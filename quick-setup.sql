-- 🎵 Musaix Audio Analyzer - Complete Database Setup
-- Copy this entire script to Supabase SQL Editor and click "Run"

-- Enable pgvector extension for AI similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Audio files table - stores uploaded file metadata
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
    tags TEXT[],
    is_reference_track BOOLEAN DEFAULT false,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio analysis table - stores AI analysis results
CREATE TABLE IF NOT EXISTS audio_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_file_id UUID REFERENCES audio_files ON DELETE CASCADE,
    tempo FLOAT,
    beat_count INTEGER,
    audio_key TEXT,
    mfccs JSONB,
    spectral_features JSONB,
    chroma_vector JSONB,
    energy_curve JSONB,
    metadata JSONB,
    embedding vector(1536), -- OpenAI embeddings
    processing_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist items junction table
CREATE TABLE IF NOT EXISTS playlist_items (
    playlist_id UUID REFERENCES playlists ON DELETE CASCADE,
    audio_file_id UUID REFERENCES audio_files ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (playlist_id, audio_file_id)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- High-performance vector similarity index
CREATE INDEX IF NOT EXISTS audio_embedding_hnsw_idx ON audio_analysis
USING hnsw (embedding vector_cosine_ops);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_status ON audio_analysis(processing_status);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);

-- Enable Row-Level Security
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Security policies for audio_files
CREATE POLICY IF NOT EXISTS "Users view own files" ON audio_files
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users insert own files" ON audio_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users update own files" ON audio_files
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users delete own files" ON audio_files
    FOR DELETE USING (auth.uid() = user_id);

-- Security policies for audio_analysis
CREATE POLICY IF NOT EXISTS "Users view own analysis" ON audio_analysis
    FOR SELECT USING (
        audio_file_id IN (SELECT id FROM audio_files WHERE user_id = auth.uid())
    );
CREATE POLICY IF NOT EXISTS "Users insert analysis" ON audio_analysis
    FOR INSERT WITH CHECK (
        audio_file_id IN (SELECT id FROM audio_files WHERE user_id = auth.uid())
    );

-- Security policies for playlists
CREATE POLICY IF NOT EXISTS "Users view own playlists" ON playlists
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY IF NOT EXISTS "Users manage own playlists" ON playlists
    FOR ALL USING (auth.uid() = user_id);

-- AI similarity search function
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
        af.id, af.filename, af.storage_path, af.duration,
        aa.embedding <=> query_embedding AS similarity
    FROM audio_analysis AS aa
    JOIN audio_files AS af ON aa.audio_file_id = af.id
    WHERE aa.embedding <=> query_embedding < match_threshold
        AND aa.processing_status = 'completed'
    ORDER BY similarity ASC
    LIMIT match_count;
$$;

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files', 
    false,
    524288000, -- 500MB limit
    ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg']::text[]
) ON CONFLICT (id) DO NOTHING;

-- Storage security policies
CREATE POLICY IF NOT EXISTS "Users upload audio files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY IF NOT EXISTS "Users view own audio files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audio-files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Success confirmation
SELECT '🎵 Musaix Audio Analyzer database setup complete! All tables, indexes, and policies created.' AS message;