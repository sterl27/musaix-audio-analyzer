from http.server import BaseHTTPRequestHandler
import json
import tempfile
import os
import requests
from analyze import analyze_audio, validate_audio_file

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """
        Vercel serverless function handler for audio analysis.
        Expected payload: {"storagePath": "path/to/file.mp3", "analysisId": "uuid"}
        """
        try:
            # Parse the request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error(400, "Empty request body")
                return
                
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            # Validate required fields
            storage_path = body.get('storagePath')
            analysis_id = body.get('analysisId')
            
            if not storage_path or not analysis_id:
                self.send_error(400, "Missing storagePath or analysisId")
                return
            
            # Download the audio file from Supabase Storage
            supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
            supabase_service_key = os.environ.get('SUPABASE_SERVICE_KEY')
            
            if not supabase_url or not supabase_service_key:
                self.send_error(500, "Missing Supabase configuration")
                return
            
            # Construct the download URL
            download_url = f"{supabase_url}/storage/v1/object/audio-files/{storage_path}"
            
            # Download the file with service role authorization
            headers = {
                'Authorization': f'Bearer {supabase_service_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(download_url, headers=headers, stream=True)
            
            if response.status_code != 200:
                self.send_error(500, f"Failed to download audio file: {response.status_code}")
                return
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
                for chunk in response.iter_content(chunk_size=8192):
                    temp_file.write(chunk)
                temp_file_path = temp_file.name
            
            try:
                # Validate the audio file
                if not validate_audio_file(temp_file_path):
                    analysis_results = {
                        "processing_status": "failed",
                        "error": "Invalid audio file format"
                    }
                else:
                    # Analyze the audio file
                    analysis_results = analyze_audio(temp_file_path)
                
                # Post results back to Next.js callback
                callback_url = f"{os.environ.get('NEXT_PUBLIC_APP_URL')}/api/analysis/callback"
                webhook_secret = os.environ.get('VERCEL_WEBHOOK_SECRET')
                
                callback_headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {webhook_secret}'
                }
                
                callback_payload = {
                    'analysisId': analysis_id,
                    'results': analysis_results
                }
                
                callback_response = requests.post(
                    callback_url, 
                    headers=callback_headers, 
                    data=json.dumps(callback_payload),
                    timeout=30
                )
                
                if callback_response.status_code != 200:
                    print(f"Failed to post callback: {callback_response.status_code}")
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response_data = {
                    'success': True,
                    'analysisId': analysis_id,
                    'status': analysis_results.get('processing_status', 'completed')
                }
                
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                
            finally:
                # Clean up the temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON in request body")
        except Exception as e:
            print(f"Error in analysis function: {e}")
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def do_GET(self):
        """Health check endpoint"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        health_data = {
            'status': 'healthy',
            'service': 'musaix-audio-analyzer',
            'version': '1.0.0'
        }
        
        self.wfile.write(json.dumps(health_data).encode('utf-8'))