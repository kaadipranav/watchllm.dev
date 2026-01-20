"""
WatchLLM LangChain Integration - Callback Handler
Provides seamless integration with LangChain agents, chains, and LLMs.

Usage:
    from watchllm import WatchLLMClient
    from watchllm.langchain import WatchLLMCallbackHandler

    client = WatchLLMClient(api_key="your-key", project_id="your-project")
    handler = WatchLLMCallbackHandler(client)

    # Use with any LangChain component
    agent = initialize_agent(..., callbacks=[handler])
    chain = LLMChain(..., callbacks=[handler])
"""

import time
import uuid
import traceback
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field

try:
    from langchain_core.callbacks import BaseCallbackHandler
    from langchain_core.messages import BaseMessage
    from langchain_core.outputs import LLMResult, ChatGeneration, Generation
    from langchain_core.agents import AgentAction, AgentFinish
    LANGCHAIN_AVAILABLE = True
except ImportError:
    try:
        # Fallback for older langchain versions
        from langchain.callbacks.base import BaseCallbackHandler
        from langchain.schema import LLMResult, AgentAction, AgentFinish, BaseMessage
        from langchain.schema.output import ChatGeneration, Generation
        LANGCHAIN_AVAILABLE = True
    except ImportError:
        LANGCHAIN_AVAILABLE = False
        # Define a stub base class for type hints when LangChain isn't installed
        class BaseCallbackHandler:
            """Stub for when LangChain is not installed."""
            pass

from .client import WatchLLMClient, Status, StepType


@dataclass
class RunContext:
    """Stores context for an active run."""
    run_id: str
    parent_run_id: Optional[str] = None
    start_time: float = field(default_factory=time.time)
    step_count: int = 0
    model: str = ""
    prompt: str = ""
    tokens_input: int = 0
    tokens_output: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


class WatchLLMCallbackHandler(BaseCallbackHandler):
    """
    LangChain callback handler for WatchLLM observability.
    
    Automatically captures:
    - LLM calls (prompts, responses, tokens, costs)
    - Agent actions and decisions
    - Tool calls and results
    - Chain executions
    - Errors and exceptions
    
    Example:
        ```python
        from watchllm import WatchLLMClient
        from watchllm.langchain import WatchLLMCallbackHandler
        from langchain.agents import initialize_agent, AgentType
        from langchain_openai import ChatOpenAI
        
        # Initialize WatchLLM
        client = WatchLLMClient(
            api_key="your-watchllm-api-key",
            project_id="your-project-id"
        )
        handler = WatchLLMCallbackHandler(client)
        
        # Create agent with handler
        llm = ChatOpenAI(model="gpt-4")
        agent = initialize_agent(
            tools=[...],
            llm=llm,
            agent=AgentType.OPENAI_FUNCTIONS,
            callbacks=[handler]  # One line integration!
        )
        
        # All interactions are now automatically logged
        result = agent.run("What is 2 + 2?")
        ```
    """
    
    def __init__(
        self,
        client: WatchLLMClient,
        run_id: Optional[str] = None,
        user_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        log_prompts: bool = True,
        log_responses: bool = True,
    ):
        """
        Initialize the WatchLLM callback handler.
        
        Args:
            client: A WatchLLMClient instance
            run_id: Optional run ID to group all events. If not provided, one is generated.
            user_id: Optional user ID to associate with all events
            tags: Optional tags to add to all events
            metadata: Optional metadata to include with all events
            log_prompts: Whether to log full prompt text (set False for privacy)
            log_responses: Whether to log full response text (set False for privacy)
        """
        if not LANGCHAIN_AVAILABLE:
            raise ImportError(
                "LangChain is not installed. Install it with: "
                "pip install langchain langchain-core"
            )
        
        super().__init__()
        self.client = client
        self.run_id = run_id or str(uuid.uuid4())
        self.user_id = user_id
        self.tags = tags or []
        self.metadata = metadata or {}
        self.log_prompts = log_prompts
        self.log_responses = log_responses
        
        # Track active runs by their run_id
        self._runs: Dict[str, RunContext] = {}
        # Track the chain of runs for parent-child relationships
        self._run_stack: List[str] = []
    
    def _get_run_context(self, run_id: str) -> RunContext:
        """Get or create a run context."""
        if run_id not in self._runs:
            parent_id = self._run_stack[-1] if self._run_stack else None
            self._runs[run_id] = RunContext(
                run_id=run_id,
                parent_run_id=parent_id
            )
        return self._runs[run_id]
    
    def _cleanup_run(self, run_id: str) -> Optional[RunContext]:
        """Clean up a run context and return it."""
        return self._runs.pop(run_id, None)
    
    def _serialize_message(self, message: Any) -> str:
        """Serialize a message to string."""
        if hasattr(message, 'content'):
            return str(message.content)
        return str(message)
    
    def _serialize_messages(self, messages: List[Any]) -> str:
        """Serialize a list of messages to a prompt string."""
        if not messages:
            return ""
        
        parts = []
        for msg in messages:
            if hasattr(msg, 'type') and hasattr(msg, 'content'):
                parts.append(f"[{msg.type}]: {msg.content}")
            elif hasattr(msg, 'content'):
                parts.append(str(msg.content))
            else:
                parts.append(str(msg))
        
        return "\n".join(parts)
    
    def _extract_token_usage(self, response: Any) -> Dict[str, int]:
        """Extract token usage from LLM response."""
        usage = {"input": 0, "output": 0, "total": 0}
        
        if response is None:
            return usage
            
        # Try to get from llm_output
        if hasattr(response, 'llm_output') and response.llm_output:
            llm_output = response.llm_output
            if isinstance(llm_output, dict):
                token_usage = llm_output.get('token_usage', {})
                if isinstance(token_usage, dict):
                    usage["input"] = token_usage.get('prompt_tokens', 0)
                    usage["output"] = token_usage.get('completion_tokens', 0)
                    usage["total"] = token_usage.get('total_tokens', 0)
        
        return usage
    
    def _extract_model_name(self, serialized: Dict[str, Any]) -> str:
        """Extract model name from serialized LLM."""
        # Try different paths to find the model name
        if 'kwargs' in serialized:
            kwargs = serialized['kwargs']
            for key in ['model', 'model_name', 'model_id']:
                if key in kwargs:
                    return str(kwargs[key])
        
        if 'name' in serialized:
            return str(serialized['name'])
        
        if 'id' in serialized:
            id_parts = serialized['id']
            if isinstance(id_parts, list) and len(id_parts) > 0:
                return str(id_parts[-1])
        
        return "unknown"
    
    # =========================================================================
    # LLM Callbacks
    # =========================================================================
    
    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """Called when LLM starts processing."""
        run_id_str = str(run_id) if run_id else str(uuid.uuid4())
        
        ctx = self._get_run_context(run_id_str)
        ctx.start_time = time.time()
        ctx.model = self._extract_model_name(serialized)
        ctx.prompt = prompts[0] if prompts else ""
        ctx.metadata = {**self.metadata, **(metadata or {})}
        
        self._run_stack.append(run_id_str)
    
    def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[Any]],
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """Called when chat model starts processing."""
        run_id_str = str(run_id) if run_id else str(uuid.uuid4())
        
        ctx = self._get_run_context(run_id_str)
        ctx.start_time = time.time()
        ctx.model = self._extract_model_name(serialized)
        
        # Flatten messages
        all_messages = []
        for msg_list in messages:
            if isinstance(msg_list, list):
                all_messages.extend(msg_list)
            else:
                all_messages.append(msg_list)
        
        ctx.prompt = self._serialize_messages(all_messages)
        ctx.metadata = {**self.metadata, **(metadata or {})}
        
        self._run_stack.append(run_id_str)
    
    def on_llm_end(
        self,
        response: Any,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when LLM finishes processing."""
        run_id_str = str(run_id) if run_id else ""
        
        ctx = self._cleanup_run(run_id_str)
        if run_id_str in self._run_stack:
            self._run_stack.remove(run_id_str)
        
        if ctx is None:
            return
        
        latency_ms = int((time.time() - ctx.start_time) * 1000)
        
        # Extract response text
        response_text = ""
        if hasattr(response, 'generations') and response.generations:
            for gen_list in response.generations:
                if isinstance(gen_list, list) and len(gen_list) > 0:
                    gen = gen_list[0]
                    if hasattr(gen, 'text'):
                        response_text = gen.text
                    elif hasattr(gen, 'message') and hasattr(gen.message, 'content'):
                        response_text = str(gen.message.content)
                    break
        
        # Extract token usage
        usage = self._extract_token_usage(response)
        
        self.client.log_prompt_call(
            run_id=self.run_id,
            prompt=ctx.prompt if self.log_prompts else "[REDACTED]",
            model=ctx.model,
            response=response_text if self.log_responses else "[REDACTED]",
            tokens_input=usage["input"],
            tokens_output=usage["output"],
            latency_ms=latency_ms,
            status=Status.SUCCESS,
            response_metadata=ctx.metadata,
            tags=self.tags,
            user_id=self.user_id,
        )
    
    def on_llm_error(
        self,
        error: BaseException,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when LLM encounters an error."""
        run_id_str = str(run_id) if run_id else ""
        
        ctx = self._cleanup_run(run_id_str)
        if run_id_str in self._run_stack:
            self._run_stack.remove(run_id_str)
        
        latency_ms = int((time.time() - (ctx.start_time if ctx else time.time())) * 1000)
        
        self.client.log_prompt_call(
            run_id=self.run_id,
            prompt=(ctx.prompt if ctx and self.log_prompts else "[REDACTED]"),
            model=(ctx.model if ctx else "unknown"),
            response="",
            tokens_input=0,
            tokens_output=0,
            latency_ms=latency_ms,
            status=Status.ERROR,
            error={
                "message": str(error),
                "type": type(error).__name__,
                "stack": traceback.format_exc(),
            },
            tags=self.tags,
            user_id=self.user_id,
        )
    
    # =========================================================================
    # Chain Callbacks
    # =========================================================================
    
    def on_chain_start(
        self,
        serialized: Dict[str, Any],
        inputs: Dict[str, Any],
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """Called when chain starts."""
        run_id_str = str(run_id) if run_id else str(uuid.uuid4())
        
        ctx = self._get_run_context(run_id_str)
        ctx.start_time = time.time()
        ctx.metadata = {
            "chain_name": serialized.get("name", "unknown"),
            "chain_type": serialized.get("id", ["unknown"])[-1] if serialized.get("id") else "unknown",
            "inputs": inputs,
            **(metadata or {}),
        }
        
        self._run_stack.append(run_id_str)
    
    def on_chain_end(
        self,
        outputs: Dict[str, Any],
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when chain ends."""
        run_id_str = str(run_id) if run_id else ""
        
        ctx = self._cleanup_run(run_id_str)
        if run_id_str in self._run_stack:
            self._run_stack.remove(run_id_str)
        
        if ctx is None:
            return
        
        latency_ms = int((time.time() - ctx.start_time) * 1000)
        ctx.step_count += 1
        
        chain_name = ctx.metadata.get("chain_name", "chain")
        
        self.client.log_agent_step(
            run_id=self.run_id,
            step_number=ctx.step_count,
            step_name=f"chain:{chain_name}",
            step_type=StepType.REASONING,
            input_data=ctx.metadata.get("inputs", {}),
            output_data=outputs,
            latency_ms=latency_ms,
            status=Status.SUCCESS,
            context={"chain_type": ctx.metadata.get("chain_type")},
            tags=self.tags,
            user_id=self.user_id,
        )
    
    def on_chain_error(
        self,
        error: BaseException,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when chain encounters an error."""
        run_id_str = str(run_id) if run_id else ""
        
        ctx = self._cleanup_run(run_id_str)
        if run_id_str in self._run_stack:
            self._run_stack.remove(run_id_str)
        
        self.client.log_error(
            run_id=self.run_id,
            error=error,
            context={"chain_metadata": ctx.metadata if ctx else {}},
            tags=self.tags,
            user_id=self.user_id,
        )
    
    # =========================================================================
    # Tool Callbacks
    # =========================================================================
    
    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        inputs: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """Called when tool starts execution."""
        run_id_str = str(run_id) if run_id else str(uuid.uuid4())
        
        ctx = self._get_run_context(run_id_str)
        ctx.start_time = time.time()
        ctx.metadata = {
            "tool_name": serialized.get("name", "unknown"),
            "tool_description": serialized.get("description", ""),
            "input_str": input_str,
            "inputs": inputs or {},
            **(metadata or {}),
        }
        
        self._run_stack.append(run_id_str)
    
    def on_tool_end(
        self,
        output: Any,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when tool finishes execution."""
        run_id_str = str(run_id) if run_id else ""
        
        ctx = self._cleanup_run(run_id_str)
        if run_id_str in self._run_stack:
            self._run_stack.remove(run_id_str)
        
        if ctx is None:
            return
        
        latency_ms = int((time.time() - ctx.start_time) * 1000)
        ctx.step_count += 1
        
        tool_name = ctx.metadata.get("tool_name", "unknown")
        
        self.client.log_agent_step(
            run_id=self.run_id,
            step_number=ctx.step_count,
            step_name=f"tool:{tool_name}",
            step_type=StepType.TOOL_CALL,
            input_data={
                "input": ctx.metadata.get("input_str", ""),
                "inputs": ctx.metadata.get("inputs", {}),
            },
            output_data={"output": str(output) if output else ""},
            latency_ms=latency_ms,
            status=Status.SUCCESS,
            context={"tool_description": ctx.metadata.get("tool_description", "")},
            tags=self.tags,
            user_id=self.user_id,
        )
    
    def on_tool_error(
        self,
        error: BaseException,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when tool encounters an error."""
        run_id_str = str(run_id) if run_id else ""
        
        ctx = self._cleanup_run(run_id_str)
        if run_id_str in self._run_stack:
            self._run_stack.remove(run_id_str)
        
        tool_name = ctx.metadata.get("tool_name", "unknown") if ctx else "unknown"
        
        self.client.log_error(
            run_id=self.run_id,
            error=error,
            context={
                "tool_name": tool_name,
                "tool_metadata": ctx.metadata if ctx else {},
            },
            tags=self.tags,
            user_id=self.user_id,
        )
    
    # =========================================================================
    # Agent Callbacks
    # =========================================================================
    
    def on_agent_action(
        self,
        action: Any,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when agent takes an action."""
        run_id_str = str(run_id) if run_id else str(uuid.uuid4())
        
        ctx = self._get_run_context(run_id_str)
        ctx.step_count += 1
        
        # Extract action details
        tool = getattr(action, 'tool', 'unknown')
        tool_input = getattr(action, 'tool_input', {})
        log = getattr(action, 'log', '')
        
        self.client.log_agent_step(
            run_id=self.run_id,
            step_number=ctx.step_count,
            step_name=f"agent_action:{tool}",
            step_type=StepType.REASONING,
            input_data={"tool_input": tool_input},
            output_data={},
            reasoning=log,
            latency_ms=0,
            status=Status.SUCCESS,
            tags=self.tags,
            user_id=self.user_id,
        )
    
    def on_agent_finish(
        self,
        finish: Any,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when agent finishes."""
        run_id_str = str(run_id) if run_id else str(uuid.uuid4())
        
        ctx = self._get_run_context(run_id_str)
        ctx.step_count += 1
        
        # Extract finish details
        return_values = getattr(finish, 'return_values', {})
        log = getattr(finish, 'log', '')
        
        self.client.log_agent_step(
            run_id=self.run_id,
            step_number=ctx.step_count,
            step_name="agent_finish",
            step_type=StepType.OUTPUT,
            input_data={},
            output_data=return_values,
            reasoning=log,
            latency_ms=0,
            status=Status.SUCCESS,
            tags=self.tags,
            user_id=self.user_id,
        )
    
    # =========================================================================
    # Retriever Callbacks
    # =========================================================================
    
    def on_retriever_start(
        self,
        serialized: Dict[str, Any],
        query: str,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """Called when retriever starts."""
        run_id_str = str(run_id) if run_id else str(uuid.uuid4())
        
        ctx = self._get_run_context(run_id_str)
        ctx.start_time = time.time()
        ctx.metadata = {
            "retriever_type": serialized.get("name", "unknown"),
            "query": query,
            **(metadata or {}),
        }
        
        self._run_stack.append(run_id_str)
    
    def on_retriever_end(
        self,
        documents: List[Any],
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when retriever ends."""
        run_id_str = str(run_id) if run_id else ""
        
        ctx = self._cleanup_run(run_id_str)
        if run_id_str in self._run_stack:
            self._run_stack.remove(run_id_str)
        
        if ctx is None:
            return
        
        latency_ms = int((time.time() - ctx.start_time) * 1000)
        ctx.step_count += 1
        
        # Serialize documents
        doc_summaries = []
        for doc in documents[:5]:  # Limit to 5 docs for logging
            if hasattr(doc, 'page_content'):
                doc_summaries.append({
                    "content_preview": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "metadata": getattr(doc, 'metadata', {}),
                })
            else:
                doc_summaries.append({"content": str(doc)[:200]})
        
        self.client.log_agent_step(
            run_id=self.run_id,
            step_number=ctx.step_count,
            step_name="retriever",
            step_type=StepType.TOOL_CALL,
            input_data={"query": ctx.metadata.get("query", "")},
            output_data={
                "document_count": len(documents),
                "documents": doc_summaries,
            },
            latency_ms=latency_ms,
            status=Status.SUCCESS,
            context={"retriever_type": ctx.metadata.get("retriever_type")},
            tags=self.tags,
            user_id=self.user_id,
        )
    
    def on_retriever_error(
        self,
        error: BaseException,
        *,
        run_id: Optional[Any] = None,
        parent_run_id: Optional[Any] = None,
        **kwargs: Any,
    ) -> None:
        """Called when retriever encounters an error."""
        run_id_str = str(run_id) if run_id else ""
        
        ctx = self._cleanup_run(run_id_str)
        if run_id_str in self._run_stack:
            self._run_stack.remove(run_id_str)
        
        self.client.log_error(
            run_id=self.run_id,
            error=error,
            context={"retriever_metadata": ctx.metadata if ctx else {}},
            tags=self.tags,
            user_id=self.user_id,
        )


def create_callback_handler(
    client: WatchLLMClient,
    **kwargs
) -> WatchLLMCallbackHandler:
    """
    Factory function to create a WatchLLM callback handler.
    
    Args:
        client: A WatchLLMClient instance
        **kwargs: Additional arguments passed to WatchLLMCallbackHandler
        
    Returns:
        A configured WatchLLMCallbackHandler instance
    """
    return WatchLLMCallbackHandler(client, **kwargs)
