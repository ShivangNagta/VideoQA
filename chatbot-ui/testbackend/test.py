import asyncio
import websockets
import os
import json

# Directory to save uploaded videos
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Dummy ML model for chat-based Q&A
def answer_question(question, video_context):
    # Simulate answering based on the video context
    if "duration" in question.lower():
        return f"The video is {video_context.get('metadata', {}).get('duration', 'unknown')} long."
    elif "resolution" in question.lower():
        return f"The video resolution is {video_context.get('metadata', {}).get('resolution', 'unknown')}."
    else:
        return "I'm sorry, I can't answer that question about the video."

# Placeholder function to simulate video processing (store metadata, etc.)
def process_video(video_data):
    # Simulate saving and processing the video file
    print(f"Processing video: {video_data['filename']}")
    # Simulated video metadata
    video_metadata = {
        "duration": "2 minutes",
        "resolution": "1920x1080",
        "summary": "Video contains a person walking in a park."
    }
    return video_metadata

async def handle_client(websocket):
    video_metadata = None  # Store video metadata

    try:
        while True:
            message = await websocket.recv()

            # Determine if the received message is binary (video data) or text (JSON)
            if isinstance(message, bytes):
                # Handle binary data (video file)
                if video_metadata is None:
                    print("Received video file.")

                    # Save the binary data to a file
                    video_path = os.path.join(UPLOAD_DIR, "uploaded_video.mp4")
                    with open(video_path, "wb") as f:
                        f.write(message)
                    print(f"Video saved to {video_path}")

                    # Process the video (generate metadata)
                    video_metadata = process_video({"filename": video_path})

                    # Send back a response indicating the video is processed
                    await websocket.send(json.dumps({
                        "status": "video_processed",
                        "data": video_metadata  # Include actual metadata
                    }))
                    print("Video processed.")
                else:
                    print("Video already processed, no need to resend.")
                    await websocket.send(json.dumps({
                        "status": "error",
                        "message": "Video already processed."
                    }))
            elif isinstance(message, str):
                # Handle JSON text message (questions)
                try:
                    data = json.loads(message)  # Parse JSON
                    if data.get("type") == "question" and video_metadata:
                        # Answer the question based on processed video metadata
                        question = data.get("question")
                        answer = answer_question(question, {"metadata": video_metadata})
                        await websocket.send(json.dumps({"type": "answer", "data": answer}))
                    else:
                        await websocket.send(json.dumps({
                            "status": "error",
                            "message": "Invalid message type or missing context."
                        }))
                except json.JSONDecodeError:
                    await websocket.send(json.dumps({
                        "status": "error",
                        "message": "Invalid JSON format."
                    }))
            else:
                # Unexpected data type
                print("Unexpected message type received.")
                await websocket.send(json.dumps({
                    "status": "error",
                    "message": "Unexpected message type."
                }))
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")

# Main server entry point
async def main():
    print("WebSocket server starting on port 8090", flush=True)
    async with websockets.serve(
        handle_client,
        "0.0.0.0",
        int(os.environ.get('PORT', 8090)),
        max_size=10**8,  # Allow large file uploads (adjust as needed)
    ):
        print("WebSocket server running", flush=True)
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
