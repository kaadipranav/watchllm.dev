"""
WatchLLM - Python SDK for AI Observability
Provides a simple interface for logging AI events and metrics
"""

import json
import time
import datetime
import uuid
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import queue
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import random
import traceback


class EventType(Enum):
    PROMPT_CALL = "prompt_call"
    TOOL_CALL = "tool_call"
    AGENT_STEP = "agent_step"
    ERROR = "error"
    ASSERTION_FAILED = "assertion_failed"
    HALLUCINATION_DETECTED = "hallucination_detected"
    COST_THRESHOLD_EXCEEDED = "cost_threshold_exceeded"
    PERFORMANCE_ALERT = "performance_alert"


class Status(Enum):
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"
    ASSERTION_FAILED = "assertion_failed"
    WARNING = "warning"


class StepType(Enum):
    REASONING = "reasoning"
    TOOL_CALL = "tool_call"
    VALIDATION = "validation"
    OUTPUT = "output"


class AssertionType(Enum):
    RESPONSE_FORMAT = "response_format"
    CONTENT_FILTER = "content_filter"
    SAFETY_CHECK = "safety_check"
    CUSTOM = "custom"


class DetectionMethod(Enum):
    HEURISTIC = "heuristic"
    MODEL_ENSEMBLE = "model_ensemble"
    GROUND_TRUTH_VERIFICATION = "ground_truth_verification"


class AlertType(Enum):
    COST_SPIKE = "cost_spike"
    LATENCY_SPIKE = "latency_spike"
    ERROR_RATE_SPIKE = "error_rate_spike"
    TOKEN_LIMIT = "token_limit"


class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class BaseEvent:
    event_id: str
    project_id: str
    run_id: str
    timestamp: str
    user_id: Optional[str] = None
    tags: List[str] = None
    release: Optional[str] = None
    env: str = "development"
    client: Dict[str, Any] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.client is None:
            self.client = {
                "sdk_version": "0.1.0",
                "platform": "python",
                "hostname": "unknown"
            }


@dataclass
class ToolCallEvent:
    tool_name: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    latency_ms: int
    status: Union[Status, str]
    tool_id: Optional[str] = None
    error: Optional[Dict[str, str]] = None

    def __post_init__(self):
        if isinstance(self.status, Status):
            self.status = self.status.value


@dataclass
class PromptCallEvent(BaseEvent):
    event_type: str = EventType.PROMPT_CALL.value
    prompt: str = ""
    prompt_template_id: Optional[str] = None
    model: str = ""
    model_version: Optional[str] = None
    tokens_input: int = 0
    tokens_output: int = 0
    cost_estimate_usd: float = 0.0
    response: str = ""
    response_metadata: Dict[str, Any] = None
    tool_calls: List[ToolCallEvent] = None
    status: Union[Status, str] = Status.SUCCESS
    error: Optional[Dict[str, str]] = None
    latency_ms: int = 0

    def __post_init__(self):
        super().__post_init__()
        if self.response_metadata is None:
            self.response_metadata = {}
        if self.tool_calls is None:
            self.tool_calls = []
        if isinstance(self.status, Status):
            self.status = self.status.value


@dataclass
class AgentStepEvent(BaseEvent):
    event_type: str = EventType.AGENT_STEP.value
    step_number: int = 0
    step_name: str = ""
    step_type: Union[StepType, str] = StepType.REASONING
    input_data: Dict[str, Any] = None
    output_data: Dict[str, Any] = None
    reasoning: Optional[str] = None
    context: Dict[str, Any] = None
    latency_ms: int = 0
    status: Union[Status, str] = Status.SUCCESS
    error: Optional[Dict[str, str]] = None

    def __post_init__(self):
        super().__post_init__()
        if self.input_data is None:
            self.input_data = {}
        if self.output_data is None:
            self.output_data = {}
        if self.context is None:
            self.context = {}
        if isinstance(self.status, Status):
            self.status = self.status.value
        if isinstance(self.step_type, StepType):
            self.step_type = self.step_type.value


@dataclass
class ErrorEvent(BaseEvent):
    event_type: str = EventType.ERROR.value
    error: Dict[str, str] = None
    context: Dict[str, Any] = None
    stack_trace: Optional[str] = None

    def __post_init__(self):
        super().__post_init__()
        if self.error is None:
            self.error = {}
        if self.context is None:
            self.context = {}


@dataclass
class AssertionFailedEvent(BaseEvent):
    event_type: str = EventType.ASSERTION_FAILED.value
    assertion_name: str = ""
    assertion_type: Union[AssertionType, str] = AssertionType.CUSTOM
    expected: Any = None
    actual: Any = None
    severity: Union[Severity, str] = Severity.MEDIUM

    def __post_init__(self):
        super().__post_init__()
        if isinstance(self.assertion_type, AssertionType):
            self.assertion_type = self.assertion_type.value
        if isinstance(self.severity, Severity):
            self.severity = self.severity.value


@dataclass
class HallucinationDetectedEvent(BaseEvent):
    event_type: str = EventType.HALLUCINATION_DETECTED.value
    detection_method: Union[DetectionMethod, str] = DetectionMethod.HEURISTIC
    confidence_score: float = 0.0
    flagged_content: str = ""
    ground_truth: Optional[str] = None
    recommendations: List[str] = None

    def __post_init__(self):
        super().__post_init__()
        if self.recommendations is None:
            self.recommendations = []
        if isinstance(self.detection_method, DetectionMethod):
            self.detection_method = self.detection_method.value


@dataclass
class PerformanceAlertEvent(BaseEvent):
    event_type: str = EventType.PERFORMANCE_ALERT.value
    alert_type: Union[AlertType, str] = AlertType.COST_SPIKE
    threshold: float = 0.0
    actual_value: float = 0.0
    window_minutes: int = 0
    affected_models: List[str] = None

    def __post_init__(self):
        super().__post_init__()
        if self.affected_models is None:
            self.affected_models = []
        if isinstance(self.alert_type, AlertType):
            self.alert_type = self.alert_type.value


class WatchLLMClient:
    """
    Main client for WatchLLM AI observability
    """

    def __init__(
        self,
        api_key: str,
        project_id: str,
        base_url: str = "https://proxy.watchllm.dev/v1",
        environment: str = "development",
        sample_rate: float = 1.0,
        redact_pii: bool = True,
        batch_size: int = 10,
        flush_interval_seconds: int = 5,
        timeout: int = 30
    ):
        self.api_key = api_key
        self.project_id = project_id
        self.base_url = base_url.rstrip('/')
        self.environment = environment
        self.sample_rate = sample_rate
        self.redact_pii = redact_pii
        self.batch_size = batch_size
        self.flush_interval_seconds = flush_interval_seconds
        self.timeout = timeout

        self._event_queue = queue.Queue(maxsize=1000)
        self._shutdown_event = threading.Event()
        self._flush_thread = None
        self._session = None

        self._start_flush_thread()

    def _start_flush_thread(self):
        self._flush_thread = threading.Thread(target=self._flush_worker, daemon=True)
        self._flush_thread.start()

    def _flush_worker(self):
        last_flush_time = time.time()
        
        while not self._shutdown_event.is_set():
            try:
                current_time = time.time()
                queue_size = self._event_queue.qsize()
                
                time_since_flush = current_time - last_flush_time
                should_flush = (
                    queue_size >= self.batch_size or 
                    (queue_size > 0 and time_since_flush >= self.flush_interval_seconds)
                )

                if should_flush:
                    self.flush()
                    last_flush_time = time.time()
                
                time.sleep(1.0)
                
            except Exception as e:
                print(f"[WatchLLM] Error in flush worker: {e}")

    def _get_session(self) -> requests.Session:
        if self._session is None:
            self._session = requests.Session()
            retry_strategy = Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[408, 429, 500, 502, 503, 504],
            )
            adapter = HTTPAdapter(max_retries=retry_strategy)
            self._session.mount("http://", adapter)
            self._session.mount("https://", adapter)
        return self._session

    def _should_sample(self) -> bool:
        return self.sample_rate >= 1.0 or (self.sample_rate > 0 and random.random() < self.sample_rate)

    def _redact_pii(self, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        if not self.redact_pii:
            return event_dict

        import re
        event_str = json.dumps(event_dict)
        
        event_str = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED_EMAIL]', event_str)
        event_str = re.sub(r'\b(?:\d{4}[-\s]?){3}\d{4}\b', '[REDACTED_CC]', event_str)
        
        return json.loads(event_str)

    def _get_timestamp(self) -> str:
        return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

    def _queue_event(self, event: BaseEvent):
        if not self._should_sample():
            return

        try:
            event_dict = asdict(event)
            event_dict = self._redact_pii(event_dict)
            self._event_queue.put(event_dict, block=False)
        except queue.Full:
            print("[WatchLLM] Event queue full, dropping event")
        except Exception as e:
            print(f"[WatchLLM] Failed to queue event: {e}")

    def log_prompt_call(
        self,
        run_id: str,
        prompt: str,
        model: str,
        response: str,
        tokens_input: int,
        tokens_output: int,
        latency_ms: int,
        status: Union[Status, str] = Status.SUCCESS,
        error: Optional[Dict[str, str]] = None,
        prompt_template_id: Optional[str] = None,
        model_version: Optional[str] = None,
        response_metadata: Optional[Dict[str, Any]] = None,
        tool_calls: Optional[List[Dict[str, Any]]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        release: Optional[str] = None
    ) -> str:
        event_id = str(uuid.uuid4())
        
        cost_estimate = self._calculate_cost_estimate(model, tokens_input, tokens_output)

        tool_call_events = []
        if tool_calls:
            for tc in tool_calls:
                tool_call_events.append(ToolCallEvent(
                    tool_name=tc['tool_name'],
                    tool_id=tc.get('tool_id'),
                    input=tc.get('input', {}),
                    output=tc.get('output', {}),
                    latency_ms=tc.get('latency_ms', 0),
                    status=tc.get('status', Status.SUCCESS),
                    error=tc.get('error')
                ))

        event = PromptCallEvent(
            event_id=event_id,
            project_id=self.project_id,
            run_id=run_id,
            timestamp=self._get_timestamp(),
            prompt=prompt,
            model=model,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            cost_estimate_usd=cost_estimate,
            response=response,
            response_metadata=response_metadata or {},
            tool_calls=tool_call_events,
            latency_ms=latency_ms,
            status=status,
            error=error,
            prompt_template_id=prompt_template_id,
            model_version=model_version,
            tags=tags or [],
            user_id=user_id,
            release=release,
            env=self.environment
        )

        self._queue_event(event)
        return event_id

    def log_agent_step(
        self,
        run_id: str,
        step_number: int,
        step_name: str,
        step_type: Union[StepType, str],
        input_data: Dict[str, Any],
        output_data: Dict[str, Any],
        latency_ms: int,
        status: Union[Status, str] = Status.SUCCESS,
        reasoning: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        error: Optional[Dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        release: Optional[str] = None
    ) -> str:
        event_id = str(uuid.uuid4())
        
        event = AgentStepEvent(
            event_id=event_id,
            project_id=self.project_id,
            run_id=run_id,
            timestamp=self._get_timestamp(),
            step_number=step_number,
            step_name=step_name,
            step_type=step_type,
            input_data=input_data,
            output_data=output_data,
            reasoning=reasoning,
            context=context or {},
            latency_ms=latency_ms,
            status=status,
            error=error,
            tags=tags or [],
            user_id=user_id,
            release=release,
            env=self.environment
        )

        self._queue_event(event)
        return event_id

    def log_error(
        self,
        run_id: str,
        error: Union[Exception, Dict[str, str]],
        context: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        release: Optional[str] = None
    ) -> str:
        event_id = str(uuid.uuid4())
        
        if isinstance(error, Exception):
            error_dict = {
                "message": str(error),
                "type": type(error).__name__,
                "stack": traceback.format_exc()
            }
        else:
            error_dict = error

        event = ErrorEvent(
            event_id=event_id,
            project_id=self.project_id,
            run_id=run_id,
            timestamp=self._get_timestamp(),
            error=error_dict,
            context=context or {},
            stack_trace=error_dict.get("stack"),
            tags=tags or [],
            user_id=user_id,
            release=release,
            env=self.environment
        )

        self._queue_event(event)
        return event_id

    def flush(self):
        events = []
        while not self._event_queue.empty():
            try:
                event = self._event_queue.get_nowait()
                events.append(event)
                if len(events) >= 100:
                    break
            except queue.Empty:
                break

        if not events:
            return

        try:
            self._send_events_batch(events)
        except Exception as e:
            print(f"[WatchLLM] Failed to flush events: {e}")

    def _send_events_batch(self, events: List[Dict[str, Any]]):
        session = self._get_session()
        try:
            response = session.post(
                f"{self.base_url}/events/batch",
                json={"events": events},
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                timeout=self.timeout
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise e

    def _calculate_cost_estimate(self, model: str, tokens_input: int, tokens_output: int) -> float:
        pricing = {
            "gpt-4o": {"input": 0.005, "output": 0.015},
            "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
            "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
            "gpt-4-turbo": {"input": 0.01, "output": 0.03},
            "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
        }

        model_pricing = pricing.get(model)
        if not model_pricing:
            if "gpt-4" in model:
                model_pricing = {"input": 0.03, "output": 0.06}
            else:
                model_pricing = {"input": 0.001, "output": 0.002}

        return (tokens_input * model_pricing["input"] + tokens_output * model_pricing["output"]) / 1000

    def close(self):
        self._shutdown_event.set()
        try:
            self.flush()
        except Exception:
            pass
        if self._flush_thread and self._flush_thread.is_alive():
            self._flush_thread.join(timeout=1.0)
        if self._session:
            self._session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def init(
    api_key: str,
    project_id: str,
    **kwargs
) -> WatchLLMClient:
    return WatchLLMClient(api_key, project_id, **kwargs)
