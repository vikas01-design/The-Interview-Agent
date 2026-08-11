from __future__ import annotations

import ast
import logging
import re
import subprocess
import sys
import time
from app.models.schemas import CodeExecutionResult

logger = logging.getLogger(__name__)


def extract_python_code(text: str) -> str | None:
    """Extract Python code block from markdown or raw candidate text."""
    if not text:
        return None

    # Match ```python ... ``` or ``` ... ```
    pattern = r"```(?:python)?\s*(.*?)\s*```"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    if matches:
        code = max(matches, key=len).strip()
        if len(code) > 10:
            return code

    lines = text.strip().split("\n")
    if len(lines) >= 2 and any(line.strip().startswith(("def ", "import ", "from ", "class ", "return ")) for line in lines):
        return text.strip()

    return None


def execute_candidate_code(message: str) -> CodeExecutionResult | None:
    """
    Safely extract and execute Python code snippet from candidate message.

    Enforces:
    - AST syntax validation check
    - Subprocess execution with 3.0s timeout
    - Output capture & error categorization
    """
    code = extract_python_code(message)
    if not code:
        return None

    start_time = time.perf_counter()

    # 1. AST Syntax Check
    try:
        ast.parse(code)
    except SyntaxError as syn_err:
        elapsed = (time.perf_counter() - start_time) * 1000
        logger.info("Candidate code syntax error: %s", syn_err)
        return CodeExecutionResult(
            executed=True,
            extractedCode=code,
            syntaxValid=False,
            passed=False,
            stdout="",
            stderr=str(syn_err),
            errorType="SyntaxError",
            executionTimeMs=round(elapsed, 2),
        )

    # 2. Subprocess Sandbox Execution
    try:
        runner_script = f"""
import sys, math, json, re
{code}
"""
        proc = subprocess.run(
            [sys.executable, "-c", runner_script],
            capture_output=True,
            text=True,
            timeout=3.0,
        )
        elapsed = (time.perf_counter() - start_time) * 1000

        stdout = proc.stdout.strip()[:1000]
        stderr = proc.stderr.strip()[:1000]
        passed = proc.returncode == 0

        error_type = None
        if not passed:
            if "NameError" in stderr:
                error_type = "NameError"
            elif "TypeError" in stderr:
                error_type = "TypeError"
            elif "ZeroDivisionError" in stderr:
                error_type = "ZeroDivisionError"
            elif "ImportError" in stderr or "ModuleNotFoundError" in stderr:
                error_type = "ImportError"
            else:
                error_type = "RuntimeError"

        return CodeExecutionResult(
            executed=True,
            extractedCode=code,
            syntaxValid=True,
            passed=passed,
            stdout=stdout,
            stderr=stderr,
            errorType=error_type,
            executionTimeMs=round(elapsed, 2),
        )

    except subprocess.TimeoutExpired:
        elapsed = (time.perf_counter() - start_time) * 1000
        logger.warning("Candidate code execution timed out (>3s)")
        return CodeExecutionResult(
            executed=True,
            extractedCode=code,
            syntaxValid=True,
            passed=False,
            stdout="",
            stderr="Execution timed out after 3 seconds (possible infinite loop).",
            errorType="TimeoutError",
            executionTimeMs=round(elapsed, 2),
        )
    except Exception as exc:
        elapsed = (time.perf_counter() - start_time) * 1000
        logger.warning("Code execution exception: %s", exc)
        return CodeExecutionResult(
            executed=True,
            extractedCode=code,
            syntaxValid=True,
            passed=False,
            stdout="",
            stderr=str(exc),
            errorType="ExecutionError",
            executionTimeMs=round(elapsed, 2),
        )
