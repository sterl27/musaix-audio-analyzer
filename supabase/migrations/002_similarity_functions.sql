-- Vector similarity search function
-- This migration adds the RPC function for finding similar audio files

-- Function to search for similar audio files using vector embeddings
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
    similarity float -- This will be the cosine distance
)
LANGUAGE sql STABLE
AS $$
    SELECT
        af.id,
        af.filename,
        af.storage_path,
        af.duration,
        -- The <=> operator calculates the cosine distance (1 - cosine similarity)
        aa.embedding <=> query_embedding AS similarity
    FROM
        audio_analysis AS aa
    JOIN
        audio_files AS af ON aa.audio_file_id = af.id
    WHERE
        -- Only include results where the distance is below the threshold
        aa.embedding <=> query_embedding < match_threshold
        AND aa.processing_status = 'completed'
        -- Ensure user can access the files (RLS will handle this)
    ORDER BY
        -- Order by the closest matches first
        similarity ASC
    LIMIT
        match_count;
$$;

-- Function to get audio analysis statistics
CREATE OR REPLACE FUNCTION get_analysis_stats()
RETURNS TABLE (
    total_files bigint,
    completed_analyses bigint,
    pending_analyses bigint,
    failed_analyses bigint,
    average_tempo float,
    total_storage_used bigint
)
LANGUAGE sql STABLE
AS $$
    SELECT
        COUNT(af.id) as total_files,
        COUNT(CASE WHEN aa.processing_status = 'completed' THEN 1 END) as completed_analyses,
        COUNT(CASE WHEN aa.processing_status = 'pending' THEN 1 END) as pending_analyses,
        COUNT(CASE WHEN aa.processing_status = 'failed' THEN 1 END) as failed_analyses,
        AVG(aa.tempo) as average_tempo,
        COALESCE(SUM(af.file_size), 0) as total_storage_used
    FROM
        audio_files af
    LEFT JOIN
        audio_analysis aa ON af.id = aa.audio_file_id
    WHERE
        af.user_id = auth.uid();
$$;

-- Function to search audio files by metadata
CREATE OR REPLACE FUNCTION search_audio_files(
    search_query text,
    limit_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    filename text,
    storage_path text,
    duration float,
    tags text[],
    created_at timestamptz
)
LANGUAGE sql STABLE
AS $$
    SELECT
        af.id,
        af.filename,
        af.storage_path,
        af.duration,
        af.tags,
        af.created_at
    FROM
        audio_files af
    WHERE
        af.user_id = auth.uid()
        AND (
            af.filename ILIKE '%' || search_query || '%'
            OR search_query = ANY(af.tags)
        )
    ORDER BY
        af.created_at DESC
    LIMIT
        limit_count;
$$;