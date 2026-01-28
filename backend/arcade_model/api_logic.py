import io
from pathlib import Path

import torch
import torch.nn as nn
import cv2
import numpy as np
from PIL import Image
import torchvision.transforms as T
from fastapi import UploadFile
from torchvision.models.detection import maskrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor
import timm

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# api_logic.py -> arcade_model -> backend -> project_root
BASE_DIR = Path(__file__).resolve().parent.parent.parent

MODEL_DIR = BASE_DIR / "backend" / "arcade_model"

HYBRID_WEIGHTS = MODEL_DIR / "hybrid_stenosis_v2.pth"
MASK_WEIGHTS = MODEL_DIR / "best_maskrcnn_stenosis.pth"

# Safety checks
assert HYBRID_WEIGHTS.exists(), f"Missing model: {HYBRID_WEIGHTS}"
assert MASK_WEIGHTS.exists(), f"Missing model: {MASK_WEIGHTS}"

IMG_SIZE = 224
CLS_THRESHOLD = 0.5
MASK_THRESHOLD = 0.5

tf_cls = T.Compose([
    T.Resize((IMG_SIZE, IMG_SIZE)),
    T.ToTensor(),
    T.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def apply_clahe(img: Image.Image) -> Image.Image:
    arr = np.array(img)
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(l)
    merged = cv2.merge((l, a, b))
    return Image.fromarray(cv2.cvtColor(merged, cv2.COLOR_LAB2RGB))

class HybridModel(nn.Module):
    def __init__(self):
        super().__init__()

        self.convnext = timm.create_model(
            "convnext_tiny.fb_in22k",
            pretrained=True,
            num_classes=0
        )

        self.swin = timm.create_model(
            "swin_tiny_patch4_window7_224",
            pretrained=True,
            num_classes=0
        )

        self.fusion = nn.Sequential(
            nn.LayerNorm(768 * 2),
            nn.Linear(768 * 2, 512),
            nn.GELU(),
            nn.Dropout(0.3)
        )

        self.cls_head = nn.Linear(512, 1)
        self.box_head = nn.Sequential(
            nn.Linear(512, 4),
            nn.Sigmoid()
        )

    def forward(self, x):
        f1 = self.convnext(x)
        f2 = self.swin(x)
        z = self.fusion(torch.cat([f1, f2], dim=1))
        return self.cls_head(z), self.box_head(z)

def load_hybrid_model() -> HybridModel:
    model = HybridModel().to(DEVICE)
    model.load_state_dict(torch.load(HYBRID_WEIGHTS, map_location=DEVICE))
    model.eval()
    return model

def load_maskrcnn_model():
    model = maskrcnn_resnet50_fpn(weights=None)

    # Box predictor
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, 2)

    # Mask predictor
    in_channels = model.roi_heads.mask_predictor.conv5_mask.in_channels
    model.roi_heads.mask_predictor = MaskRCNNPredictor(in_channels, 256, 2)

    model.load_state_dict(torch.load(MASK_WEIGHTS, map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    return model

hybrid_model = load_hybrid_model()
mask_model = load_maskrcnn_model()

def predict_and_annotate(file: UploadFile):
    img_bytes = file.file.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    original = np.array(img)

    # CLAHE preprocessing
    img_clahe = apply_clahe(img)
    x = tf_cls(img_clahe).unsqueeze(0).to(DEVICE)

    # ---------- Classification ----------
    with torch.no_grad():
        logit, _ = hybrid_model(x)
        prob = torch.sigmoid(logit).item()

    detected = prob >= CLS_THRESHOLD

    if not detected:
        _, buf = cv2.imencode(
            ".png",
            cv2.cvtColor(original, cv2.COLOR_RGB2BGR)
        )
        return buf.tobytes(), False, prob

    # ---------- Segmentation ----------
    seg_tensor = T.ToTensor()(np.array(img_clahe)).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        prediction = mask_model(seg_tensor)[0]

    canvas = original.copy()

    for i, score in enumerate(prediction["scores"]):
        if score < MASK_THRESHOLD:
            continue

        mask = prediction["masks"][i, 0].cpu().numpy() > 0.5
        box = prediction["boxes"][i].cpu().numpy().astype(int)

        # Mask overlay
        overlay = np.zeros_like(canvas)
        overlay[mask] = [255, 0, 0]

        canvas = cv2.addWeighted(canvas, 1.0, overlay, 0.35, 0)

        # Bounding box
        cv2.rectangle(
            canvas,
            (box[0], box[1]),
            (box[2], box[3]),
            (0, 255, 0),
            2
        )

        # Confidence label
        cv2.putText(
            canvas,
            f"Confidence: {score:.2f}",
            (box[0], max(box[1] - 10, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )

    _, buf = cv2.imencode(
        ".png",
        cv2.cvtColor(canvas, cv2.COLOR_RGB2BGR)
    )

    return buf.tobytes(), True, prob
