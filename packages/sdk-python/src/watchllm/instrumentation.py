
import functools
import time
import uuid
from typing import Optional, Any
from .client import WatchLLMClient, Status

def instrument_openai(client: WatchLLMClient, openai_client: Any):
    """
    Instrument an OpenAI client to automatically log requests to WatchLLM.
    
    Args:
        client: WatchLLMClient instance
        openai_client: OpenAI client instance (e.g. from openai import OpenAI)
    """
    
    # Instrument Chat Completions
    if hasattr(openai_client, "chat") and hasattr(openai_client.chat, "completions"):
        original_create = openai_client.chat.completions.create
        
        @functools.wraps(original_create)
        def wrapped_create(*args, **kwargs):
            # Extract basic info
            model = kwargs.get("model", "unknown")
            messages = kwargs.get("messages", [])
            
            # Construct simplified prompt from messages
            prompt = ""
            for msg in messages:
                role = msg.get("role", "")
                content = msg.get("content", "")
                prompt += f"{role}: {content}\n"
            
            start_time = time.time()
            
            try:
                # Call original method
                response = original_create(*args, **kwargs)
                
                # Calculate latency
                latency_ms = int((time.time() - start_time) * 1000)
                
                # Extract response data
                response_content = "unknown"
                if hasattr(response, "choices") and len(response.choices) > 0:
                    response_content = response.choices[0].message.content or ""
                    
                # Extract usage
                tokens_input = 0
                tokens_output = 0
                if hasattr(response, "usage") and response.usage:
                    tokens_input = response.usage.prompt_tokens
                    tokens_output = response.usage.completion_tokens
                    
                # Log to WatchLLM
                trace_id = str(uuid.uuid4()) # In a real implementation this might be shared
                
                client.log_prompt_call(
                    run_id=trace_id,
                    prompt=prompt.strip(),
                    model=model,
                    response=response_content,
                    tokens_input=tokens_input,
                    tokens_output=tokens_output,
                    latency_ms=latency_ms,
                    status=Status.SUCCESS,
                    response_metadata=getattr(response, "model_dump", lambda: {})() 
                )
                
                return response
                
            except Exception as e:
                # Log error
                latency_ms = int((time.time() - start_time) * 1000)
                client.log_prompt_call(
                    run_id=str(uuid.uuid4()),
                    prompt=prompt.strip(),
                    model=model,
                    response="",
                    tokens_input=0, 
                    tokens_output=0,
                    latency_ms=latency_ms,
                    status=Status.ERROR,
                    error={"message": str(e)}
                )
                raise e
                
        # Apply the patch
        openai_client.chat.completions.create = wrapped_create
        
    return openai_client
