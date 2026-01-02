import matplotlib
matplotlib.use("Agg")

import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter1d
from .config import CLASS_COLORS

def generate_ecg_plot(ecg, att, label):
    att = gaussian_filter1d(att, sigma=20)
    att = (att - att.min()) / (att.max() - att.min() + 1e-8)

    thresh = np.quantile(att, 0.90)
    mask = att >= thresh

    segments, start = [], None
    for i, m in enumerate(mask):
        if m and start is None:
            start = i
        elif not m and start is not None:
            segments.append((start, i))
            start = None
    if start is not None:
        segments.append((start, len(mask)))

    fig, ax = plt.subplots(figsize=(16, 4))
    ax.plot(ecg, color="black", linewidth=1)

    color = CLASS_COLORS[label]
    if color and label != "NORM":
        for s, e in segments:
            ax.axvspan(s, e, color=color, alpha=0.25)

    ax.set_title(f"ECG Critical Regions - {label}")
    ax.set_xlabel("Samples")
    ax.set_ylabel("Amplitude")
    ax.grid(alpha=0.2)
    fig.tight_layout()
    return fig
