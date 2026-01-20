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
    "WatchLLMClient",
    "init",
    "Status",
    "EventType",
    "StepType",
    "AssertionType",
    "DetectionMethod",
    "AlertType",
    "Severity",
    "BaseEvent",
    "PromptCallEvent",
    "AgentStepEvent",
    "ErrorEvent",
    "AssertionFailedEvent",
    "HallucinationDetectedEvent",
    "PerformanceAlertEvent",
    "ToolCallEvent",
    "get_callback_handler",
]
