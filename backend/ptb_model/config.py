from pathlib import Path
import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DATA_ROOT = (
    BASE_DIR
    / "Datasets - image"
    / "ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.1"
)

CLASSES = ["NORM", "MI", "STTC", "CD", "HYP"]
TARGET_LEN = 1000

CLASS_COLORS = {
    "MI": "red",
    "STTC": "orange",
    "CD": "purple",
    "HYP": "green",
    "NORM": None
}
