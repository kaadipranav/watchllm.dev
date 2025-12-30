"""
AI Sentry - Python SDK for AI Observability
Provides a simple interface for logging AI events and metrics
"""

import json
import time
import uuid
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import queue
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class EventType(Enum):
    PROMPT_CALL = "prompt_call"
    TOOL_CALL = "tool_call"
    AGENT_STEP = "agent_step"
    ERROR = "error"
    ASSERTION_FAILED = "assertion_failed"
    HALLUCINATION_DETECTED = "hallucination_detected"
    COST_THRESHOLD_EXCEEDED = "cost_threshold_exceeded"


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
                "sdk_version": "1.0.0",
                "platform": "python"
            }


@dataclass
class ToolCallEvent:
    tool_name: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    latency_ms: int
    status: Status
    error: Optional[Dict[str, str]] = None


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
    status: Status = Status.SUCCESS
    error: Optional[Dict[str, str]] = None
    latency_ms: int = 0

    def __post_init__(self):
        super().__post_init__()
        if self.response_metadata is None:
            self.response_metadata = {}
        if self.tool_calls is None:
            self.tool_calls = []


@dataclass
class AgentStepEvent(BaseEvent):
    event_type: str = EventType.AGENT_STEP.value
    step_number: int = 0
    step_name: str = ""
    step_type: StepType = StepType.REASONING
    input_data: Dict[str, Any] = None
    output_data: Dict[str, Any] = None
    reasoning: Optional[str] = None
    context: Dict[str, Any] = None
    latency_ms: int = 0
    status: Status = Status.SUCCESS
    error: Optional[Dict[str, str]] = None

    def __post_init__(self):
        super().__post_init__()
        if self.input_data is None:
            self.input_data = {}
        if self.output_data is None:
            self.output_data = {}
        if self.context is None:
            self.context = {}


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
    assertion_type: AssertionType = AssertionType.CUSTOM
    expected: Any = None
    actual: Any = None
    severity: Severity = Severity.MEDIUM


@dataclass
class HallucinationDetectedEvent(BaseEvent):
    event_type: str = EventType.HALLUCINATION_DETECTED.value
    detection_method: DetectionMethod = DetectionMethod.HEURISTIC
    confidence_score: float = 0.0
    flagged_content: str = ""
    ground_truth: Optional[str] = None
    recommendations: List[str] = None

    def __post_init__(self):
        super().__post_init__()
        if self.recommendations is None:
            self.recommendations = []


@dataclass
class PerformanceAlertEvent(BaseEvent):
    event_type: str = EventType.COST_THRESHOLD_EXCEEDED.value
    alert_type: AlertType = AlertType.COST_SPIKE
    threshold: float = 0.0
    actual_value: float = 0.0
    window_minutes: int = 0
    affected_models: List[str] = None

    def __post_init__(self):
        super().__post_init__()
        if self.affected_models is None:
            self.affected_models = []


class AISentryClient:
    """
    Main client for AI observability
    """

    def __init__(
        self,
        api_key: str,
        project_id: str,
        base_url: str = "https://api.aisentry.com/v1",
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

        # Event queue and background thread
        self._event_queue = queue.Queue()
        self._shutdown_event = threading.Event()
        self._flush_thread = None
        self._session = None

        # Start background thread
        self._start_flush_thread()

    def _start_flush_thread(self):
        """Start the background flush thread"""
        self._flush_thread = threading.Thread(target=self._flush_worker, daemon=True)
        self._flush_thread.start()

    def _flush_worker(self):
        """Background worker that flushes events periodically"""
        while not self._shutdown_event.is_set():
            try:
                # Wait for shutdown event or flush interval
                self._shutdown_event.wait(self.flush_interval_seconds)
                if not self._shutdown_event.is_set():
                    self.flush()
            except Exception as e:
                # Log error but continue running
                print(f"Error in flush worker: {e}")

    def _get_session(self) -> requests.Session:
        """Get or create HTTP session with retry configuration"""
        if self._session is None:
            self._session = requests.Session()
            retry_strategy = Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[429, 500, 502, 503, 504],
            )
            adapter = HTTPAdapter(max_retries=retry_strategy)
            self._session.mount("http://", adapter)
            self._session.mount("https://", adapter)
        return self._session

    def _should_sample(self) -> bool:
        """Check if event should be sampled based on sample rate"""
        return self.sample_rate >= 1.0 or (self.sample_rate > 0 and random.random() < self.sample_rate)

    def _redact_pii(self, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Redact PII from event if enabled"""
        if not self.redact_pii:
            return event_dict

        # Simple PII redaction patterns
        import re
        event_str = json.dumps(event_dict)
        
        # Redact emails
        event_str = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED]', event_str)
        
        # Redact credit cards
        event_str = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[REDACTED]', event_str)
        
        # Redact SSNs
        event_str = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED]', event_str)
        
        return json.loads(event_str)

    def _queue_event(self, event: BaseEvent):
        """Queue event for background sending"""
        if not self._should_sample():
            return

        event_dict = asdict(event)
        event_dict = self._redact_pii(event_dict)
        self._event_queue.put(event_dict)

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
    ):
        """Log a prompt call event"""
        if isinstance(status, str):
            status = Status(status)

        # Calculate cost estimate
        cost_estimate = self._calculate_cost_estimate(model, tokens_input, tokens_output)

        # Convert tool calls if provided
        tool_call_events = []
        if tool_calls:
            for tc in tool_calls:
                tool_call_events.append(ToolCallEvent(
                    tool_name=tc['tool_name'],
                    input=tc['input'],
                    output=tc['output'],
                    latency_ms=tc['latency_ms'],
                    status=Status(tc['status']) if isinstance(tc['status'], str) else tc['status'],
                    error=tc.get('error')
                ))

        event = PromptCallEvent(
            event_id=str(uuid.uuid4()),
            project_id=self.project_id,
            run_id=run_id,
            timestamp=time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime()),
            prompt=prompt,
            model=model,
            response=response,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            cost_estimate_usd=cost_estimate,
            latency_ms=latency_ms,
            status=status,
            error=error,
            prompt_template_id=prompt_template_id,
            model_version=model_version,
            response_metadata=response_metadata or {},
            tool_calls=tool_call_events,
            tags=tags or [],
            user_id=user_id,
            release=release,
            env=self.environment
        )

        self._queue_event(event)

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
    ):
        """Log an agent step event"""
        if isinstance(status, str):
            status = Status(status)
        if isinstance(step_type, str):
            step_type = StepType(step_type)

        event = AgentStepEvent(
            event_id=str(uuid.uuid4()),
            project_id=self.project_id,
            run_id=run_id,
            timestamp=time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime()),
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

    def log_error(
        self,
        run_id: str,
        error: Union[Exception, Dict[str, str]],
        context: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        release: Optional[str] = None
    ):
        """Log an error event"""
        if isinstance(error, Exception):
            error_dict = {
                "message": str(error),
                "type": type(error).__name__,
                "stack": traceback.format_exc()
            }
        else:
            error_dict = error

        event = ErrorEvent(
            event_id=str(uuid.uuid4()),
            project_id=self.project_id,
            run_id=run_id,
            timestamp=time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime()),
            error=error_dict,
            context=context or {},
            stack_trace=error_dict.get("stack"),
            tags=tags or [],
            user_id=user_id,
            release=release,
            env=self.environment
        )

        self._queue_event(event)

    def log_assertion_failure(
        self,
        run_id: str,
        assertion_name: str,
        assertion_type: Union[AssertionType, str],
        expected: Any,
        actual: Any,
        severity: Union[Severity, str] = Severity.MEDIUM,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        release: Optional[str] = None
    ):
        """Log an assertion failure event"""
        if isinstance(assertion_type, str):
            assertion_type = AssertionType(assertion_type)
        if isinstance(severity, str):
            severity = Severity(severity)

        event = AssertionFailedEvent(
            event_id=str(uuid.uuid4()),
            project_id=self.project_id,
            run_id=run_id,
            timestamp=time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime()),
            assertion_name=assertion_name,
            assertion_type=assertion_type,
            expected=expected,
            actual=actual,
            severity=severity,
            tags=tags or [],
            user_id=user_id,
            release=release,
            env=self.environment
        )

        self._queue_event(event)

    def log_hallucination_detection(
        self,
        run_id: str,
        detection_method: Union[DetectionMethod, str],
        confidence_score: float,
        flagged_content: str,
        ground_truth: Optional[str] = None,
        recommendations: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        release: Optional[str] = None
    ):
        """Log a hallucination detection event"""
        if isinstance(detection_method, str):
            detection_method = DetectionMethod(detection_method)

        event = HallucinationDetectedEvent(
            event_id=str(uuid.uuid4()),
            project_id=self.project_id,
            run_id=run_id,
            timestamp=time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime()),
            detection_method=detection_method,
            confidence_score=confidence_score,
            flagged_content=flagged_content,
            ground_truth=ground_truth,
            recommendations=recommendations or [],
            tags=tags or [],
            user_id=user_id,
            release=release,
            env=self.environment
        )

        self._queue_event(event)

    def log_performance_alert(
        self,
        run_id: str,
        alert_type: Union[AlertType, str],
        threshold: float,
        actual_value: float,
        window_minutes: int,
        affected_models: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        release: Optional[str] = None
    ):
        """Log a performance alert event"""
        if isinstance(alert_type, str):
            alert_type = AlertType(alert_type)

        event = PerformanceAlertEvent(
            event_id=str(uuid.uuid4()),
            project_id=self.project_id,
            run_id=run_id,
            timestamp=time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime()),
            alert_type=alert_type,
            threshold=threshold,
            actual_value=actual_value,
            window_minutes=window_minutes,
            affected_models=affected_models or [],
            tags=tags or [],
            user_id=user_id,
            release=release,
            env=self.environment
        )

        self._queue_event(event)

    def flush(self):
        """Manually flush all queued events"""
        events = []
        
        # Collect all events from queue
        while not self._event_queue.empty():
            try:
                event = self._event_queue.get_nowait()
                events.append(event)
            except queue.Empty:
                break

        if not events:
            return

        try:
            # Send events in batch
            self._send_events_batch(events)
        except Exception as e:
            # Re-queue events on failure
            for event in events:
                self._event_queue.put(event)
            raise e

    def _send_events_batch(self, events: List[Dict[str, Any]]):
        """Send a batch of events to the API"""
        session = self._get_session()
        
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
        return response.json()

    def get_events(
        self,
        limit: int = 50,
        event_types: Optional[List[str]] = None,
        status: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        text_search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Query events from the API"""
        session = self._get_session()
        
        query = {
            "project_id": self.project_id,
            "limit": limit,
            "sort_by": "timestamp",
            "sort_order": "desc"
        }

        if event_types:
            query["event_types"] = event_types
        if status:
            query["status"] = status
        if date_from:
            query["date_from"] = date_from
        if date_to:
            query["date_to"] = date_to
        if text_search:
            query["text_search"] = text_search

        response = session.post(
            f"{self.base_url}/events/query",
            json=query,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=self.timeout
        )

        response.raise_for_status()
        return response.json()

    def get_metrics(
        self,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get project metrics from the API"""
        session = self._get_session()
        
        params = {}
        if date_from:
            params["date_from"] = date_from
        if date_to:
            params["date_to"] = date_to

        response = session.get(
            f"{self.base_url}/projects/{self.project_id}/metrics",
            params=params,
            headers={
                "Authorization": f"Bearer {self.api_key}"
            },
            timeout=self.timeout
        )

        response.raise_for_status()
        return response.json()

    def _calculate_cost_estimate(self, model: str, tokens_input: int, tokens_output: int) -> float:
        """Calculate cost estimate for a model call"""
        # Simplified pricing model
        pricing = {
            "gpt-4o": {"input": 0.005, "output": 0.015},
            "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
            "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
            "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
            "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
        }

        model_pricing = pricing.get(model, {"input": 0.001, "output": 0.002})
        return (tokens_input * model_pricing["input"] + tokens_output * model_pricing["output"]) / 1000

    def close(self):
        """Close the client and clean up resources"""
        self._shutdown_event.set()
        
        # Flush remaining events
        try:
            self.flush()
        except Exception:
            pass  # Ignore errors during shutdown
        
        # Wait for flush thread to finish
        if self._flush_thread and self._flush_thread.is_alive():
            self._flush_thread.join(timeout=5)
        
        # Close HTTP session
        if self._session:
            self._session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# Convenience function for creating a client
def create_client(
    api_key: str,
    project_id: str,
    **kwargs
) -> AISentryClient:
    """Create a new AISentry client"""
    return AISentryClient(api_key, project_id, **kwargs)


# Import required modules
import random
import traceback
