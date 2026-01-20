"""
WatchLLM Auto-Instrumentation Module

Provides automatic interception of OpenAI and Anthropic API calls using monkey-patching.
This allows developers to capture all LLM interactions without modifying their existing code.

Usage:
    import watchllm
    
    # Enable auto-instrumentation with a single call
    watchllm.auto_instrument(
        api_key="your-watchllm-key",
        project_id="your-project-id"
    )
    
    # Now all OpenAI/Anthropic calls are automatically logged
    import openai
    client = openai.OpenAI()
    response = client.chat.completions.create(...)  # Automatically logged!
"""

import time
import uuid
import functools
import traceback
from typing import Any, Callable, Dict, List, Optional, Union, TYPE_CHECKING
from contextlib import contextmanager
import threading

from .client import WatchLLMClient, Status

if TYPE_CHECKING:
    pass

# Global state for instrumentation
_global_client: Optional[WatchLLMClient] = None
_instrumentation_enabled: bool = False
_original_methods: Dict[str, Callable] = {}
_run_id_context: threading.local = threading.local()


def get_current_run_id() -> str:
    """Get the current run ID from thread-local context or generate a new one."""
    run_id = getattr(_run_id_context, 'run_id', None)
    if run_id is None:
        return str(uuid.uuid4())
    return run_id


@contextmanager
def trace(run_id: Optional[str] = None, user_id: Optional[str] = None, tags: Optional[List[str]] = None):
    """
    Context manager to group multiple LLM calls under a single run ID.
    
    Usage:
        with watchllm.trace(run_id="my-session") as run:
            response1 = client.chat.completions.create(...)
            response2 = client.chat.completions.create(...)
            # Both calls are grouped under "my-session"
    
    Args:
        run_id: Optional run ID. If not provided, one is generated.
        user_id: Optional user ID to associate with all calls in this trace.
        tags: Optional tags to add to all calls in this trace.
    """
    old_run_id = getattr(_run_id_context, 'run_id', None)
    old_user_id = getattr(_run_id_context, 'user_id', None)
    old_tags = getattr(_run_id_context, 'tags', None)
    
    _run_id_context.run_id = run_id or str(uuid.uuid4())
    _run_id_context.user_id = user_id
    _run_id_context.tags = tags or []
    
    try:
        yield _run_id_context.run_id
    finally:
        _run_id_context.run_id = old_run_id
        _run_id_context.user_id = old_user_id
        _run_id_context.tags = old_tags


# =============================================================================
# Cost Calculation
# =============================================================================

# Pricing per 1K tokens (as of 2024)
MODEL_PRICING = {
    # OpenAI models
    "gpt-4o": {"input": 0.0025, "output": 0.01},
    "gpt-4o-2024-11-20": {"input": 0.0025, "output": 0.01},
    "gpt-4o-2024-08-06": {"input": 0.0025, "output": 0.01},
    "gpt-4o-2024-05-13": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-4o-mini-2024-07-18": {"input": 0.00015, "output": 0.0006},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-4-turbo-2024-04-09": {"input": 0.01, "output": 0.03},
    "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
    "gpt-4-1106-preview": {"input": 0.01, "output": 0.03},
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-4-0613": {"input": 0.03, "output": 0.06},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "gpt-3.5-turbo-0125": {"input": 0.0005, "output": 0.0015},
    "gpt-3.5-turbo-1106": {"input": 0.001, "output": 0.002},
    "o1": {"input": 0.015, "output": 0.06},
    "o1-2024-12-17": {"input": 0.015, "output": 0.06},
    "o1-preview": {"input": 0.015, "output": 0.06},
    "o1-mini": {"input": 0.003, "output": 0.012},
    "o1-mini-2024-09-12": {"input": 0.003, "output": 0.012},
    
    # Anthropic models
    "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
    "claude-3-5-sonnet-20240620": {"input": 0.003, "output": 0.015},
    "claude-3-5-haiku-20241022": {"input": 0.0008, "output": 0.004},
    "claude-3-opus-20240229": {"input": 0.015, "output": 0.075},
    "claude-3-sonnet-20240229": {"input": 0.003, "output": 0.015},
    "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
    "claude-2.1": {"input": 0.008, "output": 0.024},
    "claude-2.0": {"input": 0.008, "output": 0.024},
    "claude-instant-1.2": {"input": 0.0008, "output": 0.0024},
    
    # Embedding models
    "text-embedding-3-small": {"input": 0.00002, "output": 0},
    "text-embedding-3-large": {"input": 0.00013, "output": 0},
    "text-embedding-ada-002": {"input": 0.0001, "output": 0},
}


def calculate_cost(model: str, tokens_input: int, tokens_output: int) -> float:
    """Calculate cost in USD based on model and token counts."""
    # Try exact match first
    pricing = MODEL_PRICING.get(model)
    
    if not pricing:
        # Try prefix matching
        for model_prefix, price in MODEL_PRICING.items():
            if model.startswith(model_prefix):
                pricing = price
                break
    
    if not pricing:
        # Default pricing for unknown models
        if "gpt-4" in model:
            pricing = {"input": 0.03, "output": 0.06}
        elif "gpt-3" in model or "gpt-35" in model:
            pricing = {"input": 0.001, "output": 0.002}
        elif "claude" in model:
            pricing = {"input": 0.003, "output": 0.015}
        else:
            pricing = {"input": 0.001, "output": 0.002}
    
    return (tokens_input * pricing["input"] + tokens_output * pricing["output"]) / 1000


# =============================================================================
# OpenAI Instrumentation
# =============================================================================

def _extract_openai_messages(messages: List[Dict[str, Any]]) -> str:
    """Extract prompt text from OpenAI messages format."""
    parts = []
    for msg in messages:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        if isinstance(content, list):
            # Handle multimodal content
            text_parts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    text_parts.append(item.get("text", ""))
            content = " ".join(text_parts)
        parts.append(f"[{role}]: {content}")
    return "\n".join(parts)


def _extract_openai_response(response: Any) -> str:
    """Extract response text from OpenAI response object."""
    try:
        if hasattr(response, 'choices') and response.choices:
            choice = response.choices[0]
            if hasattr(choice, 'message') and choice.message:
                content = choice.message.content
                return content if content else ""
            elif hasattr(choice, 'text'):
                return choice.text or ""
    except Exception:
        pass
    return ""


def _extract_openai_usage(response: Any) -> Dict[str, int]:
    """Extract token usage from OpenAI response."""
    usage = {"input": 0, "output": 0, "total": 0}
    try:
        if hasattr(response, 'usage') and response.usage:
            usage["input"] = getattr(response.usage, 'prompt_tokens', 0) or 0
            usage["output"] = getattr(response.usage, 'completion_tokens', 0) or 0
            usage["total"] = getattr(response.usage, 'total_tokens', 0) or 0
    except Exception:
        pass
    return usage


def _wrap_openai_chat_completions_create(original_method: Callable) -> Callable:
    """Wrap OpenAI chat.completions.create method."""
    
    @functools.wraps(original_method)
    def wrapper(self, *args, **kwargs):
        if not _instrumentation_enabled or _global_client is None:
            return original_method(self, *args, **kwargs)
        
        start_time = time.time()
        error_info = None
        response = None
        
        # Extract request info
        model = kwargs.get('model', 'unknown')
        messages = kwargs.get('messages', [])
        prompt = _extract_openai_messages(messages)
        
        try:
            response = original_method(self, *args, **kwargs)
            status = Status.SUCCESS
        except Exception as e:
            error_info = {
                "message": str(e),
                "type": type(e).__name__,
                "stack": traceback.format_exc(),
            }
            status = Status.ERROR
            raise
        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Extract response info
            response_text = _extract_openai_response(response) if response else ""
            usage = _extract_openai_usage(response) if response else {"input": 0, "output": 0}
            cost = calculate_cost(model, usage["input"], usage["output"])
            
            # Get context from thread-local storage
            run_id = get_current_run_id()
            user_id = getattr(_run_id_context, 'user_id', None)
            tags = getattr(_run_id_context, 'tags', []) or []
            
            try:
                _global_client.log_prompt_call(
                    run_id=run_id,
                    prompt=prompt,
                    model=model,
                    response=response_text,
                    tokens_input=usage["input"],
                    tokens_output=usage["output"],
                    latency_ms=latency_ms,
                    status=status,
                    error=error_info,
                    response_metadata={
                        "provider": "openai",
                        "cost_usd": cost,
                        "finish_reason": getattr(response.choices[0], 'finish_reason', None) if response and response.choices else None,
                    },
                    tags=["auto-instrumented", "openai"] + tags,
                    user_id=user_id,
                )
            except Exception as log_error:
                print(f"[WatchLLM] Failed to log OpenAI call: {log_error}")
        
        return response
    
    return wrapper


def _wrap_openai_chat_completions_create_async(original_method: Callable) -> Callable:
    """Wrap OpenAI async chat.completions.create method."""
    
    @functools.wraps(original_method)
    async def wrapper(self, *args, **kwargs):
        if not _instrumentation_enabled or _global_client is None:
            return await original_method(self, *args, **kwargs)
        
        start_time = time.time()
        error_info = None
        response = None
        
        model = kwargs.get('model', 'unknown')
        messages = kwargs.get('messages', [])
        prompt = _extract_openai_messages(messages)
        
        try:
            response = await original_method(self, *args, **kwargs)
            status = Status.SUCCESS
        except Exception as e:
            error_info = {
                "message": str(e),
                "type": type(e).__name__,
                "stack": traceback.format_exc(),
            }
            status = Status.ERROR
            raise
        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            
            response_text = _extract_openai_response(response) if response else ""
            usage = _extract_openai_usage(response) if response else {"input": 0, "output": 0}
            cost = calculate_cost(model, usage["input"], usage["output"])
            
            run_id = get_current_run_id()
            user_id = getattr(_run_id_context, 'user_id', None)
            tags = getattr(_run_id_context, 'tags', []) or []
            
            try:
                _global_client.log_prompt_call(
                    run_id=run_id,
                    prompt=prompt,
                    model=model,
                    response=response_text,
                    tokens_input=usage["input"],
                    tokens_output=usage["output"],
                    latency_ms=latency_ms,
                    status=status,
                    error=error_info,
                    response_metadata={
                        "provider": "openai",
                        "cost_usd": cost,
                    },
                    tags=["auto-instrumented", "openai"] + tags,
                    user_id=user_id,
                )
            except Exception as log_error:
                print(f"[WatchLLM] Failed to log OpenAI async call: {log_error}")
        
        return response
    
    return wrapper


def _wrap_openai_embeddings_create(original_method: Callable) -> Callable:
    """Wrap OpenAI embeddings.create method."""
    
    @functools.wraps(original_method)
    def wrapper(self, *args, **kwargs):
        if not _instrumentation_enabled or _global_client is None:
            return original_method(self, *args, **kwargs)
        
        start_time = time.time()
        error_info = None
        response = None
        
        model = kwargs.get('model', 'text-embedding-ada-002')
        input_text = kwargs.get('input', '')
        if isinstance(input_text, list):
            prompt = str(input_text[:3]) + ("..." if len(input_text) > 3 else "")
        else:
            prompt = str(input_text)[:500]
        
        try:
            response = original_method(self, *args, **kwargs)
            status = Status.SUCCESS
        except Exception as e:
            error_info = {
                "message": str(e),
                "type": type(e).__name__,
                "stack": traceback.format_exc(),
            }
            status = Status.ERROR
            raise
        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            
            usage = _extract_openai_usage(response) if response else {"input": 0, "output": 0}
            cost = calculate_cost(model, usage["input"], 0)
            
            run_id = get_current_run_id()
            user_id = getattr(_run_id_context, 'user_id', None)
            tags = getattr(_run_id_context, 'tags', []) or []
            
            try:
                _global_client.log_prompt_call(
                    run_id=run_id,
                    prompt=f"[embedding] {prompt}",
                    model=model,
                    response=f"[{len(response.data) if response and response.data else 0} embeddings]",
                    tokens_input=usage["input"],
                    tokens_output=0,
                    latency_ms=latency_ms,
                    status=status,
                    error=error_info,
                    response_metadata={
                        "provider": "openai",
                        "type": "embedding",
                        "cost_usd": cost,
                    },
                    tags=["auto-instrumented", "openai", "embedding"] + tags,
                    user_id=user_id,
                )
            except Exception as log_error:
                print(f"[WatchLLM] Failed to log OpenAI embedding: {log_error}")
        
        return response
    
    return wrapper


def _instrument_openai():
    """Apply instrumentation to the OpenAI library."""
    try:
        import openai
        from openai.resources.chat import completions as chat_completions
        from openai.resources import embeddings as embeddings_module
        
        # Instrument sync chat completions
        if not hasattr(chat_completions.Completions, '_watchllm_instrumented'):
            _original_methods['openai_chat_create'] = chat_completions.Completions.create
            chat_completions.Completions.create = _wrap_openai_chat_completions_create(
                chat_completions.Completions.create
            )
            chat_completions.Completions._watchllm_instrumented = True
        
        # Instrument async chat completions
        if not hasattr(chat_completions.AsyncCompletions, '_watchllm_instrumented'):
            _original_methods['openai_chat_create_async'] = chat_completions.AsyncCompletions.create
            chat_completions.AsyncCompletions.create = _wrap_openai_chat_completions_create_async(
                chat_completions.AsyncCompletions.create
            )
            chat_completions.AsyncCompletions._watchllm_instrumented = True
        
        # Instrument embeddings
        if not hasattr(embeddings_module.Embeddings, '_watchllm_instrumented'):
            _original_methods['openai_embeddings_create'] = embeddings_module.Embeddings.create
            embeddings_module.Embeddings.create = _wrap_openai_embeddings_create(
                embeddings_module.Embeddings.create
            )
            embeddings_module.Embeddings._watchllm_instrumented = True
        
        return True
    except ImportError:
        return False
    except Exception as e:
        print(f"[WatchLLM] Failed to instrument OpenAI: {e}")
        return False


def _uninstrument_openai():
    """Remove instrumentation from the OpenAI library."""
    try:
        from openai.resources.chat import completions as chat_completions
        from openai.resources import embeddings as embeddings_module
        
        if 'openai_chat_create' in _original_methods:
            chat_completions.Completions.create = _original_methods['openai_chat_create']
            delattr(chat_completions.Completions, '_watchllm_instrumented')
        
        if 'openai_chat_create_async' in _original_methods:
            chat_completions.AsyncCompletions.create = _original_methods['openai_chat_create_async']
            delattr(chat_completions.AsyncCompletions, '_watchllm_instrumented')
        
        if 'openai_embeddings_create' in _original_methods:
            embeddings_module.Embeddings.create = _original_methods['openai_embeddings_create']
            delattr(embeddings_module.Embeddings, '_watchllm_instrumented')
        
        return True
    except Exception:
        return False


# =============================================================================
# Anthropic Instrumentation
# =============================================================================

def _extract_anthropic_messages(messages: List[Dict[str, Any]], system: Optional[str] = None) -> str:
    """Extract prompt text from Anthropic messages format."""
    parts = []
    if system:
        parts.append(f"[system]: {system}")
    
    for msg in messages:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        if isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    text_parts.append(item.get("text", ""))
            content = " ".join(text_parts)
        parts.append(f"[{role}]: {content}")
    
    return "\n".join(parts)


def _extract_anthropic_response(response: Any) -> str:
    """Extract response text from Anthropic response object."""
    try:
        if hasattr(response, 'content') and response.content:
            parts = []
            for block in response.content:
                if hasattr(block, 'text'):
                    parts.append(block.text)
            return " ".join(parts)
    except Exception:
        pass
    return ""


def _extract_anthropic_usage(response: Any) -> Dict[str, int]:
    """Extract token usage from Anthropic response."""
    usage = {"input": 0, "output": 0}
    try:
        if hasattr(response, 'usage') and response.usage:
            usage["input"] = getattr(response.usage, 'input_tokens', 0) or 0
            usage["output"] = getattr(response.usage, 'output_tokens', 0) or 0
    except Exception:
        pass
    return usage


def _wrap_anthropic_messages_create(original_method: Callable) -> Callable:
    """Wrap Anthropic messages.create method."""
    
    @functools.wraps(original_method)
    def wrapper(self, *args, **kwargs):
        if not _instrumentation_enabled or _global_client is None:
            return original_method(self, *args, **kwargs)
        
        start_time = time.time()
        error_info = None
        response = None
        
        model = kwargs.get('model', 'unknown')
        messages = kwargs.get('messages', [])
        system = kwargs.get('system', None)
        prompt = _extract_anthropic_messages(messages, system)
        
        try:
            response = original_method(self, *args, **kwargs)
            status = Status.SUCCESS
        except Exception as e:
            error_info = {
                "message": str(e),
                "type": type(e).__name__,
                "stack": traceback.format_exc(),
            }
            status = Status.ERROR
            raise
        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            
            response_text = _extract_anthropic_response(response) if response else ""
            usage = _extract_anthropic_usage(response) if response else {"input": 0, "output": 0}
            cost = calculate_cost(model, usage["input"], usage["output"])
            
            run_id = get_current_run_id()
            user_id = getattr(_run_id_context, 'user_id', None)
            tags = getattr(_run_id_context, 'tags', []) or []
            
            try:
                _global_client.log_prompt_call(
                    run_id=run_id,
                    prompt=prompt,
                    model=model,
                    response=response_text,
                    tokens_input=usage["input"],
                    tokens_output=usage["output"],
                    latency_ms=latency_ms,
                    status=status,
                    error=error_info,
                    response_metadata={
                        "provider": "anthropic",
                        "cost_usd": cost,
                        "stop_reason": getattr(response, 'stop_reason', None) if response else None,
                    },
                    tags=["auto-instrumented", "anthropic"] + tags,
                    user_id=user_id,
                )
            except Exception as log_error:
                print(f"[WatchLLM] Failed to log Anthropic call: {log_error}")
        
        return response
    
    return wrapper


def _wrap_anthropic_messages_create_async(original_method: Callable) -> Callable:
    """Wrap Anthropic async messages.create method."""
    
    @functools.wraps(original_method)
    async def wrapper(self, *args, **kwargs):
        if not _instrumentation_enabled or _global_client is None:
            return await original_method(self, *args, **kwargs)
        
        start_time = time.time()
        error_info = None
        response = None
        
        model = kwargs.get('model', 'unknown')
        messages = kwargs.get('messages', [])
        system = kwargs.get('system', None)
        prompt = _extract_anthropic_messages(messages, system)
        
        try:
            response = await original_method(self, *args, **kwargs)
            status = Status.SUCCESS
        except Exception as e:
            error_info = {
                "message": str(e),
                "type": type(e).__name__,
                "stack": traceback.format_exc(),
            }
            status = Status.ERROR
            raise
        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            
            response_text = _extract_anthropic_response(response) if response else ""
            usage = _extract_anthropic_usage(response) if response else {"input": 0, "output": 0}
            cost = calculate_cost(model, usage["input"], usage["output"])
            
            run_id = get_current_run_id()
            user_id = getattr(_run_id_context, 'user_id', None)
            tags = getattr(_run_id_context, 'tags', []) or []
            
            try:
                _global_client.log_prompt_call(
                    run_id=run_id,
                    prompt=prompt,
                    model=model,
                    response=response_text,
                    tokens_input=usage["input"],
                    tokens_output=usage["output"],
                    latency_ms=latency_ms,
                    status=status,
                    error=error_info,
                    response_metadata={
                        "provider": "anthropic",
                        "cost_usd": cost,
                    },
                    tags=["auto-instrumented", "anthropic"] + tags,
                    user_id=user_id,
                )
            except Exception as log_error:
                print(f"[WatchLLM] Failed to log Anthropic async call: {log_error}")
        
        return response
    
    return wrapper


def _instrument_anthropic():
    """Apply instrumentation to the Anthropic library."""
    try:
        import anthropic
        from anthropic.resources import messages as messages_module
        
        # Instrument sync messages
        if not hasattr(messages_module.Messages, '_watchllm_instrumented'):
            _original_methods['anthropic_messages_create'] = messages_module.Messages.create
            messages_module.Messages.create = _wrap_anthropic_messages_create(
                messages_module.Messages.create
            )
            messages_module.Messages._watchllm_instrumented = True
        
        # Instrument async messages
        if not hasattr(messages_module.AsyncMessages, '_watchllm_instrumented'):
            _original_methods['anthropic_messages_create_async'] = messages_module.AsyncMessages.create
            messages_module.AsyncMessages.create = _wrap_anthropic_messages_create_async(
                messages_module.AsyncMessages.create
            )
            messages_module.AsyncMessages._watchllm_instrumented = True
        
        return True
    except ImportError:
        return False
    except Exception as e:
        print(f"[WatchLLM] Failed to instrument Anthropic: {e}")
        return False


def _uninstrument_anthropic():
    """Remove instrumentation from the Anthropic library."""
    try:
        from anthropic.resources import messages as messages_module
        
        if 'anthropic_messages_create' in _original_methods:
            messages_module.Messages.create = _original_methods['anthropic_messages_create']
            delattr(messages_module.Messages, '_watchllm_instrumented')
        
        if 'anthropic_messages_create_async' in _original_methods:
            messages_module.AsyncMessages.create = _original_methods['anthropic_messages_create_async']
            delattr(messages_module.AsyncMessages, '_watchllm_instrumented')
        
        return True
    except Exception:
        return False


# =============================================================================
# Public API
# =============================================================================

def auto_instrument(
    api_key: str,
    project_id: str,
    instrument_openai: bool = True,
    instrument_anthropic: bool = True,
    **client_kwargs
) -> WatchLLMClient:
    """
    Enable automatic instrumentation of LLM libraries.
    
    This function monkey-patches OpenAI and Anthropic libraries to automatically
    capture all API calls without requiring any code changes.
    
    Args:
        api_key: Your WatchLLM API key
        project_id: Your WatchLLM project ID
        instrument_openai: Whether to instrument the OpenAI library (default: True)
        instrument_anthropic: Whether to instrument the Anthropic library (default: True)
        **client_kwargs: Additional arguments passed to WatchLLMClient
        
    Returns:
        The WatchLLMClient instance being used for instrumentation
        
    Example:
        ```python
        import watchllm
        
        # Enable auto-instrumentation
        watchllm.auto_instrument(
            api_key="your-api-key",
            project_id="your-project-id"
        )
        
        # Now all OpenAI/Anthropic calls are automatically logged
        import openai
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": "Hello!"}]
        )
        # This call was automatically logged to WatchLLM!
        ```
    """
    global _global_client, _instrumentation_enabled
    
    # Create or update the global client
    _global_client = WatchLLMClient(api_key, project_id, **client_kwargs)
    
    instrumented = []
    
    if instrument_openai:
        if _instrument_openai():
            instrumented.append("openai")
    
    if instrument_anthropic:
        if _instrument_anthropic():
            instrumented.append("anthropic")
    
    _instrumentation_enabled = True
    
    if instrumented:
        print(f"[WatchLLM] Auto-instrumentation enabled for: {', '.join(instrumented)}")
    else:
        print("[WatchLLM] Warning: No libraries were instrumented. Make sure openai/anthropic are installed.")
    
    return _global_client


def disable_instrumentation():
    """
    Disable auto-instrumentation and restore original library methods.
    
    Example:
        ```python
        import watchllm
        
        # Enable instrumentation
        watchllm.auto_instrument(api_key="...", project_id="...")
        
        # ... make some calls ...
        
        # Disable instrumentation
        watchllm.disable_instrumentation()
        
        # Subsequent calls won't be logged
        ```
    """
    global _instrumentation_enabled, _global_client
    
    _instrumentation_enabled = False
    
    _uninstrument_openai()
    _uninstrument_anthropic()
    
    if _global_client:
        _global_client.close()
        _global_client = None
    
    _original_methods.clear()
    
    print("[WatchLLM] Auto-instrumentation disabled")


def get_client() -> Optional[WatchLLMClient]:
    """
    Get the global WatchLLM client used for auto-instrumentation.
    
    Returns:
        The WatchLLMClient instance, or None if not initialized.
    """
    return _global_client


def is_instrumented() -> bool:
    """
    Check if auto-instrumentation is currently enabled.
    
    Returns:
        True if instrumentation is enabled, False otherwise.
    """
    return _instrumentation_enabled
