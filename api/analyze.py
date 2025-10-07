import librosa
import numpy as np
import openai
import os
import json

# Initialize the OpenAI client
openai.api_key = os.environ.get("OPENAI_API_KEY")

def analyze_audio(file_path: str) -> dict:
    """
    Analyzes an audio file to extract musical features and generate a vector embedding.

    Args:
        file_path: The local path to the audio file.

    Returns:
        A dictionary containing the analysis results.
    """
    try:
        # 1. Load the audio file
        # We use a duration of 5 minutes for analysis to keep processing time reasonable.
        # For full analysis, you might remove the duration limit.
        y, sr = librosa.load(file_path, sr=None, duration=300)

        # 2. Extract core musical features
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        
        # Extract spectral features
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]

        # Extract zero crossing rate
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        
        # Extract RMS energy
        rms = librosa.feature.rms(y=y)[0]

        # 3. Create a text summary of the audio for embedding
        # As per the README, we use OpenAI's text-embedding-3-large model.
        # To do this, we create a descriptive text summary of the audio's quantitative features.
        # This allows the text model to generate a semantically rich embedding.
        summary_text = (
            f"An audio track with a tempo of {tempo:.2f} BPM. "
            f"The average spectral centroid is {np.mean(spectral_centroid):.2f} Hz, "
            f"indicating its brightness. The average spectral bandwidth is {np.mean(spectral_bandwidth):.2f} Hz. "
            f"The spectral rolloff averages {np.mean(spectral_rolloff):.2f} Hz. "
            f"The zero crossing rate is {np.mean(zcr):.4f}, and the RMS energy is {np.mean(rms):.4f}. "
            f"The track has {len(beat_times)} detected beats over {len(y)/sr:.1f} seconds. "
            f"Primary tonal characteristics are captured by its chroma features showing "
            f"harmonic content distribution across the chromatic scale."
        )

        # 4. Generate the vector embedding using OpenAI
        response = openai.embeddings.create(
            model="text-embedding-3-large",
            input=summary_text,
            dimensions=1536
        )
        embedding = response.data[0].embedding

        # 5. Structure the final results
        analysis_results = {
            "tempo": float(tempo),
            "beat_count": len(beat_times),
            "mfccs": mfccs.tolist(), # Convert numpy array to list for JSONB
            "chroma_vector": chroma.tolist(),
            "spectral_features": {
                "centroid": spectral_centroid.tolist(),
                "bandwidth": spectral_bandwidth.tolist(),
                "rolloff": spectral_rolloff.tolist(),
                "zcr": zcr.tolist(),
                "rms": rms.tolist(),
            },
            "embedding": embedding, # The 1536-dimensional vector
            "processing_status": "completed",
            "metadata": {
                "sample_rate": sr,
                "duration": len(y)/sr,
                "summary": summary_text
            }
        }
        
        return analysis_results

    except Exception as e:
        print(f"Error during audio analysis: {e}")
        return {
            "processing_status": "failed", 
            "error": str(e),
            "metadata": {"error_details": str(e)}
        }

def validate_audio_file(file_path: str) -> bool:
    """Validate that the file is a supported audio format."""
    try:
        # Quick validation by trying to load just the first second
        y, sr = librosa.load(file_path, duration=1.0)
        return True
    except Exception as e:
        print(f"Invalid audio file: {e}")
        return False