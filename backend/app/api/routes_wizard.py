from fastapi import APIRouter

from app.core.schemas import WizardAnswers, WizardRecommendation
from app.wizard.decision_tree import recommend

router = APIRouter(prefix="/api/wizard", tags=["wizard"])


@router.post("/recommend", response_model=WizardRecommendation)
def wizard_recommend(answers: WizardAnswers):
    return recommend(answers)
