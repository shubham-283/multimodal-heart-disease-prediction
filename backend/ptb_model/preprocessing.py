import wfdb
import numpy as np
import torch
from .config import DATA_ROOT, TARGET_LEN

def clinical_features(sig):
    v5 = sig[5]
    ST = np.mean(v5[int(0.06*len(v5)):int(0.08*len(v5))])
    R_amp = np.max(v5) - np.mean(v5)
    QS = np.abs(np.min(v5) / (np.max(v5) + 1e-6))
    QT_var = np.std(v5)
    return np.array([ST, R_amp, QS, QT_var], dtype=np.float32)


def resolve_record(record_id: str):
    record_id = record_id.replace("\\", "/")

    if not record_id.endswith("_lr"):
        record_id += "_lr"

    records100 = DATA_ROOT / "records100"
    for block in records100.iterdir():
        candidate = block / record_id
        if candidate.with_suffix(".hea").exists():
            return candidate

    raise FileNotFoundError(f"ECG record not found: {record_id}")


def load_and_preprocess(record_id: str):
    record_path = resolve_record(record_id)

    rec = wfdb.rdrecord(str(record_path))
    sig = rec.p_signal.T.astype(np.float32)

    if sig.shape[0] != 12:
        sig = sig[:12] if sig.shape[0] > 12 else np.pad(
            sig, ((0, 12 - sig.shape[0]), (0, 0))
        )

    L = sig.shape[1]
    if L > TARGET_LEN:
        s = (L - TARGET_LEN) // 2
        sig = sig[:, s:s + TARGET_LEN]
    elif L < TARGET_LEN:
        sig = np.pad(sig, ((0, 0), (0, TARGET_LEN - L)), mode="edge")

    feats = clinical_features(sig)
    feats = torch.tensor(feats).unsqueeze(1).repeat(1, TARGET_LEN)

    x = torch.cat([torch.tensor(sig), feats], dim=0).unsqueeze(0)
    return x, sig
