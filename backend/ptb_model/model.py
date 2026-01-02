import torch
import torch.nn as nn
import numpy as np
from .config import DEVICE, CLASSES

# ------------------ MODEL ------------------
class ResBlock(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.seq = nn.Sequential(
            nn.Conv1d(c, c, 7, padding=3),
            nn.BatchNorm1d(c),
            nn.GELU(),
            nn.Conv1d(c, c, 7, padding=3),
            nn.BatchNorm1d(c),
        )

    def forward(self, x):
        return nn.GELU()(x + self.seq(x))


class ECGNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.start = nn.Sequential(
            nn.Conv1d(16, 64, 7, padding=3), nn.GELU(),
            nn.Conv1d(64, 128, 7, padding=3), nn.GELU(),
        )
        self.res = nn.Sequential(
            ResBlock(128), ResBlock(128), ResBlock(128)
        )
        self.lstm = nn.LSTM(128, 256, batch_first=True, bidirectional=True)
        self.att = nn.Sequential(
            nn.Linear(512, 256), nn.GELU(),
            nn.Linear(256, 64), nn.GELU(),
            nn.Linear(64, 1),
        )
        self.out = nn.Linear(512, len(CLASSES))

    def forward(self, x, return_attention=False):
        x = self.start(x)
        x = self.res(x)
        x = x.permute(0, 2, 1)
        o, _ = self.lstm(x)
        att = torch.softmax(self.att(o), dim=1)
        pooled = (att * o).sum(1)
        logits = self.out(pooled)
        return (logits, att.squeeze(-1)) if return_attention else logits


# ------------------ LOAD CHECKPOINT ------------------
ckpt = torch.load("ptb_model/best_confusion_fixed.pt",
                  map_location=DEVICE,
                  weights_only=False)

MODEL = ECGNet().to(DEVICE)
MODEL.load_state_dict(ckpt["model_state_dict"])
MODEL.eval()

THRESHOLDS = ckpt["thresholds"]


def decide_class(probs, thresholds, margin=0.08):
    probs = np.array(probs)
    top = np.argmax(probs)
    second = np.argsort(probs)[-2]

    if probs[top] - probs[second] >= margin:
        return top

    idx = {c: i for i, c in enumerate(CLASSES)}
    if top in [idx["MI"], idx["STTC"]]:
        return idx["MI"] if probs[idx["MI"]] >= probs[idx["STTC"]] else idx["STTC"]
    if top in [idx["CD"], idx["HYP"]]:
        return idx["CD"] if probs[idx["CD"]] >= probs[idx["HYP"]] else idx["HYP"]

    return top
