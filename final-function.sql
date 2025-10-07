-- Final piece: Vector Similarity Search Function
-- Copy and run this in Supabase SQL Editor to complete your setup

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

-- Verify the function was created
SELECT 'Vector similarity search function created successfully!' AS status;