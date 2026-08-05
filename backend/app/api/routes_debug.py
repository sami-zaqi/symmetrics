import numpy as np
import pandas as pd
from fastapi import APIRouter

from app.stats import descriptive

router = APIRouter(prefix="/api/_debug", tags=["debug"])


@router.get("/descriptive-demo")
def descriptive_demo():
    """Hardcoded demo proving the FastAPI + pandas + stats-module wiring works end-to-end."""
    rng = np.random.default_rng(42)
    df = pd.DataFrame(
        {
            "usia": rng.normal(24, 3, 40),
            "skor_kepatuhan": rng.normal(70, 12, 40),
        }
    )
    return {"descriptives": descriptive.run(df, ["usia", "skor_kepatuhan"])}
