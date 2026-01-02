from pathlib import Path
import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# CHANGE ONLY IF DATASET MOVES
DATA_ROOT = Path(
    r"D:\SEM 8\multimodal-heart-disease-prediction\Datasets - image"
    r"\ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.1"
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
