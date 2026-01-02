from pydantic import BaseModel, Field, model_validator

class CardioInput(BaseModel):
    age: float = Field(..., gt=0, le=120, description="Age in years")
    gender: int = Field(..., ge=0, le=1, description="0=female, 1=male")
    height: int = Field(..., ge=120, le=220, description="Height in cm")
    weight: float = Field(..., ge=30, le=250, description="Weight in kg")
    ap_hi: int = Field(..., ge=70, le=250, description="Systolic BP")
    ap_lo: int = Field(..., ge=40, le=150, description="Diastolic BP")
    cholesterol: int = Field(..., ge=1, le=3)
    gluc: int = Field(..., ge=1, le=3)
    smoke: int = Field(..., ge=0, le=1)
    alco: int = Field(..., ge=0, le=1)
    active: int = Field(..., ge=0, le=1)

    @model_validator(mode="after")
    def bp_consistency(self):
        if self.ap_hi <= self.ap_lo:
            raise ValueError("Systolic BP must be greater than Diastolic BP")
        return self
