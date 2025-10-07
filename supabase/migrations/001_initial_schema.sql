-- Initial schema setup with pgvector extension
-- This migration creates the core database structure for Musaix Audio Analyzer

-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Audio files table - stores metadata about uploaded audio files
CREATE TABLE audio_files (
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
CREATE TABLE audio_analysis (
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
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist items (many-to-many relationship)
CREATE TABLE playlist_items (
    playlist_id UUID REFERENCES playlists ON DELETE CASCADE,
    audio_file_id UUID REFERENCES audio_files ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (playlist_id, audio_file_id)
);

-- Usage analytics table for tracking user actions
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users,
    action TEXT NOT NULL, -- upload, analyze, search, chat, etc.
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector similarity indexes for performance
-- IVFFlat index for general similarity search (good for smaller datasets)
CREATE INDEX audio_embedding_ivfflat_idx ON audio_analysis
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- HNSW index for high-performance similarity search (better for larger datasets)
CREATE INDEX audio_embedding_hnsw_idx ON audio_analysis
USING hnsw (embedding vector_cosine_ops);

-- Additional indexes for performance optimization
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_tags ON audio_files USING GIN(tags);
CREATE INDEX idx_audio_analysis_status ON audio_analysis(processing_status);
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_usage_logs_user_action ON usage_logs(user_id, action, created_at);

-- Enable Row-Level Security (RLS) on all tables
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_files table
CREATE POLICY "Users view own files" ON audio_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own files" ON audio_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own files" ON audio_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own files" ON audio_files
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for audio_analysis table
CREATE POLICY "Users view own analysis" ON audio_analysis
    FOR SELECT USING (
        audio_file_id IN (SELECT id FROM audio_files WHERE user_id = auth.uid())
    );

CREATE POLICY "Users insert analysis" ON audio_analysis
    FOR INSERT WITH CHECK (
        audio_file_id IN (SELECT id FROM audio_files WHERE user_id = auth.uid())
    );

CREATE POLICY "Users update analysis" ON audio_analysis
    FOR UPDATE USING (
        audio_file_id IN (SELECT id FROM audio_files WHERE user_id = auth.uid())
    );

-- RLS Policies for playlists table
CREATE POLICY "Users view own playlists" ON playlists
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users manage own playlists" ON playlists
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for playlist_items table
CREATE POLICY "Users view playlist items" ON playlist_items
    FOR SELECT USING (
        playlist_id IN (
            SELECT id FROM playlists 
            WHERE user_id = auth.uid() OR is_public = true
        )
    );

CREATE POLICY "Users manage own playlist items" ON playlist_items
    FOR ALL USING (
        playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid())
    );

-- RLS Policies for usage_logs table
CREATE POLICY "Users view own usage logs" ON usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own usage logs" ON usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage quota enforcement function
CREATE OR REPLACE FUNCTION check_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COALESCE(SUM(file_size), 0) FROM audio_files WHERE user_id = NEW.user_id) > 5368709120 THEN
        RAISE EXCEPTION 'Storage quota exceeded (5GB limit)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce storage quota before inserting new files
CREATE TRIGGER enforce_storage_quota
    BEFORE INSERT ON audio_files
    FOR EACH ROW EXECUTE FUNCTION check_storage_quota();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update the updated_at column
CREATE TRIGGER update_audio_files_updated_at
    BEFORE UPDATE ON audio_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();