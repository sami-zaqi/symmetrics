import json

import anthropic

from app.ai.prompt_templates import (
    FEW_SHOT_EXAMPLE_INPUT,
    FEW_SHOT_EXAMPLE_OUTPUT,
    FEW_SHOT_LOGISTIC_INPUT,
    FEW_SHOT_LOGISTIC_OUTPUT,
    GUARDRAIL_SYSTEM_PROMPT,
    build_user_prompt,
)
from app.ai.safety_filters import enforce
from app.config import settings
from app.core.schemas import TestResult

MODEL_ID = "claude-haiku-4-5-20251001"

# Low-mid temperature keeps output close to the JSON facts and the few-shot
# format, trading away creative variability we don't want in a stats report.
TEMPERATURE = 0.5


def generate_narrative(result: TestResult) -> tuple[str, bool]:
    """Generate Indonesian narrative text from an already-computed TestResult.
    This function only ever accepts a TestResult — it has no access to the raw
    dataset or any stats-computation library, so it is architecturally incapable
    of computing or altering numbers itself."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    payload = result.model_dump(mode="json", exclude={"charts"})
    result_json = json.dumps(payload, ensure_ascii=False)

    messages = [
        {"role": "user", "content": build_user_prompt(FEW_SHOT_EXAMPLE_INPUT)},
        {"role": "assistant", "content": FEW_SHOT_EXAMPLE_OUTPUT},
    ]
    if result.test_id == "logistic_regression":
        messages += [
            {"role": "user", "content": build_user_prompt(FEW_SHOT_LOGISTIC_INPUT)},
            {"role": "assistant", "content": FEW_SHOT_LOGISTIC_OUTPUT},
        ]
    messages.append({"role": "user", "content": build_user_prompt(result_json)})

    response = client.messages.create(
        model=MODEL_ID,
        max_tokens=1024,
        temperature=TEMPERATURE,
        system=GUARDRAIL_SYSTEM_PROMPT,
        messages=messages,
    )
    raw_text = "".join(block.text for block in response.content if block.type == "text")
    return enforce(raw_text, result.test_id)
