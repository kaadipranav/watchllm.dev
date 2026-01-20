from .client import (
    WatchLLMClient,
    init,
    Status,
    EventType,
    StepType,
    AssertionType,
    DetectionMethod,
    AlertType,
    Severity,
    BaseEvent,
    PromptCallEvent,
    AgentStepEvent,
    ErrorEvent,
    AssertionFailedEvent,
    HallucinationDetectedEvent,
    PerformanceAlertEvent,
    ToolCallEvent
)

# Auto-instrumentation - import directly for ease of use
from .instrumentation import (
    auto_instrument,
    disable_instrumentation,
    get_client,
    is_instrumented,
    trace,
)

# LangChain integration - lazily imported to avoid requiring langchain as dependency
def get_callback_handler():
    """
    Get the WatchLLMCallbackHandler class for LangChain integration.
    
    Returns:
        WatchLLMCallbackHandler class
        
    Raises:
        ImportError: If LangChain is not installed
        
    Example:
        ```python
        from watchllm import WatchLLMClient, get_callback_handler
        
        client = WatchLLMClient(api_key="...", project_id="...")
        WatchLLMCallbackHandler = get_callback_handler()
        handler = WatchLLMCallbackHandler(client)
        
        # Or import directly:
        from watchllm.langchain import WatchLLMCallbackHandler
        ```
    """
    from .langchain import WatchLLMCallbackHandler
    return WatchLLMCallbackHandler


__all__ = [
    # Client
    "WatchLLMClient",
    "init",
    # Auto-instrumentation
    "auto_instrument",
    "disable_instrumentation",
    "get_client",
    "is_instrumented",
    "trace",
    # LangChain
    "get_callback_handler",
    # Enums
    "Status",
    "EventType",
    "StepType",
    "AssertionType",
    "DetectionMethod",
    "AlertType",
    "Severity",
    # Events
    "BaseEvent",
    "PromptCallEvent",
    "AgentStepEvent",
    "ErrorEvent",
    "AssertionFailedEvent",
    "HallucinationDetectedEvent",
    "PerformanceAlertEvent",
    "ToolCallEvent",
]
