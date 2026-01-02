from fastapi import FastAPI, HTTPException
from clinical_model.schemas import CardioInput
from clinical_model.predictor import CardioPredictor



from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io
import torch





app = FastAPI(title="Cardiovascular Screening API")

predictor = CardioPredictor()


@app.get("/")
def health_check():
    return {"status": "API is running"}

@app.post("/predict-clinical")
def predict_cardio(data: CardioInput):
    try:
        return predictor.predict(data.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io
import torch
import matplotlib.pyplot as plt

from ptb_model.config import DEVICE, TARGET_LEN
from ptb_model.preprocessing import load_and_preprocess, clinical_features
from ptb_model.model import MODEL, decide_class, THRESHOLDS, CLASSES
from ptb_model.visualization import generate_ecg_plot

class ECGRequest(BaseModel):
    record_path: str
    lead: int = 0


@app.post("/predict-image")
def predict_image(req: ECGRequest):

    try:
        x, raw_sig = load_and_preprocess(req.record_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if req.lead < 0 or req.lead >= raw_sig.shape[0]:
        raise HTTPException(status_code=400, detail="Invalid lead index")

    x = x.to(DEVICE)

    with torch.no_grad():
        logits, att = MODEL(x, return_attention=True)

    probs = torch.sigmoid(logits).cpu().numpy()[0]
    att = att.cpu().numpy()[0]

    pred_idx = decide_class(probs, THRESHOLDS)
    label = CLASSES[pred_idx]

    fig = generate_ecg_plot(
        ecg=raw_sig[req.lead][:TARGET_LEN],
        att=att,
        label=label
    )

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


from fastapi import UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import tempfile, shutil, os, io
import wfdb
import numpy as np
import torch
import matplotlib.pyplot as plt

@app.post("/predict-image-upload")
def predict_image_upload(
    record_hea: UploadFile = File(...),
    record_dat: UploadFile = File(...),
    lead: int = 0
):
    base_hea = os.path.splitext(record_hea.filename)[0]
    base_dat = os.path.splitext(record_dat.filename)[0]

    if base_hea != base_dat:
        raise HTTPException(status_code=400, detail="Filenames must match")

    with tempfile.TemporaryDirectory() as tmpdir:
        hea_path = os.path.join(tmpdir, record_hea.filename)
        dat_path = os.path.join(tmpdir, record_dat.filename)

        with open(hea_path, "wb") as f:
            shutil.copyfileobj(record_hea.file, f)

        with open(dat_path, "wb") as f:
            shutil.copyfileobj(record_dat.file, f)

        try:
            rec = wfdb.rdrecord(os.path.join(tmpdir, base_hea))
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        sig = rec.p_signal.T.astype(np.float32)

    if sig.shape[0] != 12:
        sig = sig[:12] if sig.shape[0] > 12 else np.pad(sig, ((0,12-sig.shape[0]),(0,0)))

    L = sig.shape[1]
    if L > TARGET_LEN:
        s = (L - TARGET_LEN)//2
        sig = sig[:, s:s+TARGET_LEN]
    elif L < TARGET_LEN:
        sig = np.pad(sig, ((0,0),(0,TARGET_LEN-L)), mode="edge")

    feats = clinical_features(sig)
    feats = torch.tensor(feats).unsqueeze(1).repeat(1, TARGET_LEN)
    x = torch.cat([torch.tensor(sig), feats], dim=0).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits, att = MODEL(x, return_attention=True)

    probs = torch.sigmoid(logits).cpu().numpy()[0]
    att = att.cpu().numpy()[0]

    pred_idx = decide_class(probs, THRESHOLDS)
    label = CLASSES[pred_idx]

    fig = generate_ecg_plot(
        ecg=sig[lead][:TARGET_LEN],
        att=att,
        label=label
    )

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    plt.close(fig)
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")
