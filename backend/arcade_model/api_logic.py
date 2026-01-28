import io
import torch
import cv2
import numpy as np
from PIL import Image
import torchvision.transforms as T
from fastapi import UploadFile
from torchvision.models.detection import maskrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor
import timm
import torch.nn as nn

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

IMG_SIZE = 224
CLS_THRESHOLD = 0.5
MASK_THRESHOLD = 0.5

HYBRID_WEIGHTS = r"D:\SEM 8\multimodal-heart-disease-prediction\backend\arcade_model\hybrid_stenosis_v2.pth"
MASK_WEIGHTS = r"D:\SEM 8\multimodal-heart-disease-prediction\backend\arcade_model\best_maskrcnn_stenosis.pth"

tf_cls = T.Compose([
    T.Resize((IMG_SIZE, IMG_SIZE)),
    T.ToTensor(),
    T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

def apply_clahe(img):
    arr = np.array(img)
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l,a,b = cv2.split(lab)
    l = cv2.createCLAHE(3.0,(8,8)).apply(l)
    return Image.fromarray(cv2.cvtColor(cv2.merge((l,a,b)), cv2.COLOR_LAB2RGB))

class HybridModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.convnext = timm.create_model("convnext_tiny.fb_in22k", pretrained=True, num_classes=0)
        self.swin = timm.create_model("swin_tiny_patch4_window7_224", pretrained=True, num_classes=0)
        self.fusion = nn.Sequential(
            nn.LayerNorm(768 * 2),
            nn.Linear(768 * 2, 512),
            nn.GELU(),
            nn.Dropout(0.3)
        )
        self.cls_head = nn.Linear(512, 1)
        self.box_head = nn.Sequential(nn.Linear(512, 4), nn.Sigmoid())

    def forward(self, x):
        f1 = self.convnext(x)
        f2 = self.swin(x)
        z = self.fusion(torch.cat([f1, f2], dim=1))
        return self.cls_head(z), self.box_head(z)

def load_hybrid():
    m = HybridModel().to(DEVICE)
    m.load_state_dict(torch.load(HYBRID_WEIGHTS, map_location=DEVICE))
    m.eval()
    return m

def load_maskrcnn():
    m = maskrcnn_resnet50_fpn(weights=None)
    in_f = m.roi_heads.box_predictor.cls_score.in_features
    m.roi_heads.box_predictor = FastRCNNPredictor(in_f,2)
    in_m = m.roi_heads.mask_predictor.conv5_mask.in_channels
    m.roi_heads.mask_predictor = MaskRCNNPredictor(in_m,256,2)
    m.load_state_dict(torch.load(MASK_WEIGHTS,map_location=DEVICE))
    m.to(DEVICE).eval()
    return m

hybrid_model = load_hybrid()
mask_model = load_maskrcnn()

def predict_and_annotate(file):
    img_bytes = file.file.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    orig = np.array(img)

    img_clahe = apply_clahe(img)
    x = tf_cls(img_clahe).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logit, _ = hybrid_model(x)
        prob = torch.sigmoid(logit).item()

    detected = prob >= CLS_THRESHOLD

    if not detected:
        _, buf = cv2.imencode(".png", cv2.cvtColor(orig, cv2.COLOR_RGB2BGR))
        return buf.tobytes(), False, prob

    t = T.ToTensor()(np.array(img_clahe)).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        pred = mask_model(t)[0]

    canvas = orig.copy()

    for i, score in enumerate(pred["scores"]):
        if score > MASK_THRESHOLD:
            mask = (pred["masks"][i, 0].cpu().numpy() > 0.5)

            red_overlay = np.zeros_like(canvas)
            red_overlay[mask] = [255, 0, 0]

            canvas = cv2.addWeighted(
                canvas, 1.0,
                red_overlay, 0.35,
                0
            )

            box = pred["boxes"][i].cpu().numpy().astype(int)
            cv2.rectangle(
                canvas,
                (box[0], box[1]),
                (box[2], box[3]),
                (0, 255, 0),
                2
            )

            cv2.putText(
                canvas,
                f"Confidence: {score:.2f}",
                (box[0], max(box[1]-10, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

    _, buf = cv2.imencode(".png", cv2.cvtColor(canvas, cv2.COLOR_RGB2BGR))
    return buf.tobytes(), True, prob

