import json

import anthropic

from app.ai.prompt_templates import GUARDRAIL_SYSTEM_PROMPT, build_user_prompt
from app.ai.safety_filters import enforce
from app.config import settings
from app.core.schemas import TestResult

MODEL_ID = "claude-haiku-4-5-20251001"


def generate_narrative(result: TestResult) -> tuple[str, bool]:
    """Generate Indonesian narrative text from an already-computed TestResult.
    This function only ever accepts a TestResult — it has no access to the raw
    dataset or any stats-computation library, so it is architecturally incapable
    of computing or altering numbers itself."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    payload = result.model_dump(mode="json", exclude={"charts"})
    result_json = json.dumps(payload, ensure_ascii=False)

    response = client.messages.create(
        model=MODEL_ID,
        max_tokens=1024,
        system=GUARDRAIL_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_user_prompt(result_json)}],
    )
    raw_text = "".join(block.text for block in response.content if block.type == "text")
    return enforce(raw_text, result.test_id)
