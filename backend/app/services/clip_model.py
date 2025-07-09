from transformers import AutoProcessor, CLIPModel
import os

MODEL_PATH = "./models/clip-vit-large-patch14-local"

# Load processor and model once
if not os.path.exists(MODEL_PATH):
    print(f"Downloading model to {MODEL_PATH}...")
    processor = AutoProcessor.from_pretrained("openai/clip-vit-large-patch14")
    model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
    processor.save_pretrained(MODEL_PATH)
    model.save_pretrained(MODEL_PATH)
else:
    processor = AutoProcessor.from_pretrained(MODEL_PATH)
    model = CLIPModel.from_pretrained(MODEL_PATH)

model.eval()

def clip_model():
    return processor, model
