import pickle
import numpy as np
from PIL import Image
import torch
import faiss
from tqdm import tqdm

def faiss_process(preprocessor, model, frames, device="cpu"):
    model.to(device)
    model.eval()

    frame_embeddings = []

    for frame_path in tqdm(frames, desc="Processing frames"):
        image = Image.open(frame_path).convert("RGB")
        inputs = preprocessor(images=image, return_tensors="pt").to(device)

        with torch.no_grad():
            image_features = model.get_image_features(**inputs)
            image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
            frame_embeddings.append(image_features.cpu().numpy())

    frame_embeddings = np.vstack(frame_embeddings)

    # Dummy text per frame (for now)
    transcriptions = [f"Transcription for {fp}" for fp in frames]

    # Initialize FAISS index
    embedding_dim = frame_embeddings.shape[1]
    index = faiss.IndexFlatL2(embedding_dim)
    index.add(frame_embeddings)

    metadata = [
        {"frame_path": frames[i], "transcription": transcriptions[i]} for i in range(len(frames))
    ]

    with open("metadata.pkl", "wb") as f:
        pickle.dump(metadata, f)
        print("metadata.pkl written")

    faiss.write_index(index, "faiss_index.bin")
    print("faiss_index.bin written")
