import cv2
import tempfile
from PIL import Image
import numpy as np

def extract_keyframes(video_bytes: bytes, every_n_frames=30):
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=True) as tmp:
        tmp.write(video_bytes)
        tmp.flush()

        cap = cv2.VideoCapture(tmp.name)
        frames = []
        idx = 0

        while True:
            success, frame = cap.read()
            if not success:
                break

            if idx % every_n_frames == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(frame_rgb)
                frames.append(pil_image)

            idx += 1

        cap.release()
        return frames
