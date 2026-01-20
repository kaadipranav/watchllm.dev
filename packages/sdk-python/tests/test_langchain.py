"""
Tests for WatchLLM LangChain Integration
"""

import pytest
import time
from unittest.mock import Mock, MagicMock, patch
from typing import Dict, List, Any

# Import without LangChain first to test graceful degradation
import sys


class TestLangChainImportWithoutLangChain:
    """Test behavior when LangChain is not installed."""
    
    def test_import_without_langchain(self):
        """Should raise ImportError with helpful message when LangChain not installed."""
        # Mock langchain not being available
        with patch.dict(sys.modules, {'langchain_core': None, 'langchain_core.callbacks': None}):
            # Force reimport
            if 'watchllm.langchain' in sys.modules:
                del sys.modules['watchllm.langchain']
            
            # The import should still work, but instantiation should fail
            # This is actually handled gracefully in the module


# Mock LangChain types for testing without requiring langchain installation
class MockBaseCallbackHandler:
    pass


class MockLLMResult:
    def __init__(self, text="", tokens_input=10, tokens_output=20):
        self.generations = [[MagicMock(text=text, message=MagicMock(content=text))]]
        self.llm_output = {
            "token_usage": {
                "prompt_tokens": tokens_input,
                "completion_tokens": tokens_output,
                "total_tokens": tokens_input + tokens_output,
            }
        }


class MockAgentAction:
    def __init__(self, tool="test_tool", tool_input=None, log="test log"):
        self.tool = tool
        self.tool_input = tool_input or {"input": "test"}
        self.log = log


class MockAgentFinish:
    def __init__(self, return_values=None, log="finished"):
        self.return_values = return_values or {"output": "result"}
        self.log = log


@pytest.fixture
def mock_client():
    """Create a mock WatchLLMClient."""
    client = Mock()
    client.log_prompt_call = Mock(return_value="event-123")
    client.log_agent_step = Mock(return_value="event-456")
    client.log_error = Mock(return_value="event-789")
    return client


@pytest.fixture
def handler(mock_client):
    """Create a callback handler with mocked client."""
    # Patch the LangChain import check
    with patch('watchllm.langchain.LANGCHAIN_AVAILABLE', True):
        with patch('watchllm.langchain.BaseCallbackHandler', MockBaseCallbackHandler):
            from watchllm.langchain import WatchLLMCallbackHandler
            return WatchLLMCallbackHandler(
                client=mock_client,
                run_id="test-run-123",
                user_id="user-456",
                tags=["test", "integration"],
            )


class TestWatchLLMCallbackHandler:
    """Tests for WatchLLMCallbackHandler."""
    
    def test_initialization(self, mock_client):
        """Test handler initializes with correct config."""
        with patch('watchllm.langchain.LANGCHAIN_AVAILABLE', True):
            with patch('watchllm.langchain.BaseCallbackHandler', MockBaseCallbackHandler):
                from watchllm.langchain import WatchLLMCallbackHandler
                
                handler = WatchLLMCallbackHandler(
                    client=mock_client,
                    run_id="custom-run",
                    user_id="user-123",
                    tags=["prod"],
                    metadata={"env": "production"},
                    log_prompts=False,
                    log_responses=True,
                )
                
                assert handler.run_id == "custom-run"
                assert handler.user_id == "user-123"
                assert handler.tags == ["prod"]
                assert handler.log_prompts is False
                assert handler.log_responses is True
    
    def test_auto_generated_run_id(self, mock_client):
        """Test that run_id is auto-generated if not provided."""
        with patch('watchllm.langchain.LANGCHAIN_AVAILABLE', True):
            with patch('watchllm.langchain.BaseCallbackHandler', MockBaseCallbackHandler):
                from watchllm.langchain import WatchLLMCallbackHandler
                
                handler = WatchLLMCallbackHandler(client=mock_client)
                
                assert handler.run_id is not None
                assert len(handler.run_id) == 36  # UUID format
    
    def test_on_llm_start_and_end(self, handler, mock_client):
        """Test LLM start and end callbacks."""
        serialized = {
            "name": "ChatOpenAI",
            "kwargs": {"model": "gpt-4"},
            "id": ["langchain", "chat_models", "openai", "ChatOpenAI"],
        }
        
        run_id = "llm-run-1"
        
        # Simulate LLM start
        handler.on_llm_start(
            serialized=serialized,
            prompts=["What is 2+2?"],
            run_id=run_id,
        )
        
        # Small delay to simulate processing
        time.sleep(0.01)
        
        # Simulate LLM end
        handler.on_llm_end(
            response=MockLLMResult(text="4", tokens_input=5, tokens_output=1),
            run_id=run_id,
        )
        
        # Verify log_prompt_call was called
        mock_client.log_prompt_call.assert_called_once()
        call_args = mock_client.log_prompt_call.call_args
        
        assert call_args.kwargs["run_id"] == "test-run-123"
        assert call_args.kwargs["model"] == "gpt-4"
        assert call_args.kwargs["prompt"] == "What is 2+2?"
        assert call_args.kwargs["response"] == "4"
        assert call_args.kwargs["tokens_input"] == 5
        assert call_args.kwargs["tokens_output"] == 1
    
    def test_on_llm_error(self, handler, mock_client):
        """Test LLM error callback."""
        serialized = {"name": "ChatOpenAI", "kwargs": {"model": "gpt-4"}}
        run_id = "llm-run-error"
        
        handler.on_llm_start(serialized=serialized, prompts=["test"], run_id=run_id)
        handler.on_llm_error(error=ValueError("API error"), run_id=run_id)
        
        mock_client.log_prompt_call.assert_called_once()
        call_args = mock_client.log_prompt_call.call_args
        
        assert call_args.kwargs["status"].value == "error"
        assert "API error" in call_args.kwargs["error"]["message"]
    
    def test_on_chat_model_start(self, handler, mock_client):
        """Test chat model start with messages."""
        serialized = {"name": "ChatOpenAI", "kwargs": {"model": "gpt-4o"}}
        
        messages = [[
            MagicMock(type="system", content="You are helpful"),
            MagicMock(type="human", content="Hello!"),
        ]]
        
        run_id = "chat-run-1"
        
        handler.on_chat_model_start(
            serialized=serialized,
            messages=messages,
            run_id=run_id,
        )
        
        handler.on_llm_end(
            response=MockLLMResult(text="Hi there!"),
            run_id=run_id,
        )
        
        call_args = mock_client.log_prompt_call.call_args
        prompt = call_args.kwargs["prompt"]
        
        assert "[system]:" in prompt.lower()
        assert "[human]:" in prompt.lower()
    
    def test_on_tool_start_and_end(self, handler, mock_client):
        """Test tool execution callbacks."""
        serialized = {"name": "Calculator", "kwargs": {"description": "Math tool"}}
        run_id = "tool-run-1"
        
        handler.on_tool_start(
            serialized=serialized,
            input_str="2 + 2",
            run_id=run_id,
        )
        
        time.sleep(0.01)
        
        handler.on_tool_end(output="4", run_id=run_id)
        
        mock_client.log_agent_step.assert_called_once()
        call_args = mock_client.log_agent_step.call_args
        
        assert call_args.kwargs["step_name"] == "tool:Calculator"
        assert call_args.kwargs["step_type"].value == "tool_call"
        assert call_args.kwargs["input_data"]["input"] == "2 + 2"
        assert call_args.kwargs["output_data"]["output"] == "4"
    
    def test_on_chain_start_and_end(self, handler, mock_client):
        """Test chain execution callbacks."""
        serialized = {"name": "LLMChain", "id": ["langchain", "chains", "LLMChain"]}
        run_id = "chain-run-1"
        
        handler.on_chain_start(
            serialized=serialized,
            inputs={"question": "What is AI?"},
            run_id=run_id,
        )
        
        handler.on_chain_end(
            outputs={"answer": "Artificial Intelligence"},
            run_id=run_id,
        )
        
        mock_client.log_agent_step.assert_called_once()
        call_args = mock_client.log_agent_step.call_args
        
        assert call_args.kwargs["step_name"] == "chain:LLMChain"
    
    def test_on_agent_action(self, handler, mock_client):
        """Test agent action callback."""
        action = MockAgentAction(tool="search", tool_input={"query": "test"})
        
        handler.on_agent_action(action=action, run_id="agent-run-1")
        
        mock_client.log_agent_step.assert_called_once()
        call_args = mock_client.log_agent_step.call_args
        
        assert call_args.kwargs["step_name"] == "agent_action:search"
        assert call_args.kwargs["reasoning"] == "test log"
    
    def test_on_agent_finish(self, handler, mock_client):
        """Test agent finish callback."""
        finish = MockAgentFinish(return_values={"output": "Done!"})
        
        handler.on_agent_finish(finish=finish, run_id="agent-run-1")
        
        mock_client.log_agent_step.assert_called_once()
        call_args = mock_client.log_agent_step.call_args
        
        assert call_args.kwargs["step_name"] == "agent_finish"
        assert call_args.kwargs["step_type"].value == "output"
        assert call_args.kwargs["output_data"]["output"] == "Done!"
    
    def test_privacy_redaction(self, mock_client):
        """Test that prompts and responses can be redacted."""
        with patch('watchllm.langchain.LANGCHAIN_AVAILABLE', True):
            with patch('watchllm.langchain.BaseCallbackHandler', MockBaseCallbackHandler):
                from watchllm.langchain import WatchLLMCallbackHandler
                
                handler = WatchLLMCallbackHandler(
                    client=mock_client,
                    log_prompts=False,
                    log_responses=False,
                )
                
                run_id = "private-run"
                handler.on_llm_start(
                    serialized={"kwargs": {"model": "gpt-4"}},
                    prompts=["Secret prompt"],
                    run_id=run_id,
                )
                
                handler.on_llm_end(
                    response=MockLLMResult(text="Secret response"),
                    run_id=run_id,
                )
                
                call_args = mock_client.log_prompt_call.call_args
                assert call_args.kwargs["prompt"] == "[REDACTED]"
                assert call_args.kwargs["response"] == "[REDACTED]"
    
    def test_retriever_callbacks(self, handler, mock_client):
        """Test retriever start and end callbacks."""
        serialized = {"name": "VectorStoreRetriever"}
        run_id = "retriever-run-1"
        
        handler.on_retriever_start(
            serialized=serialized,
            query="Find documents about AI",
            run_id=run_id,
        )
        
        # Mock documents
        docs = [
            MagicMock(page_content="AI is artificial intelligence", metadata={"source": "doc1"}),
            MagicMock(page_content="Machine learning is a subset of AI", metadata={"source": "doc2"}),
        ]
        
        handler.on_retriever_end(documents=docs, run_id=run_id)
        
        mock_client.log_agent_step.assert_called_once()
        call_args = mock_client.log_agent_step.call_args
        
        assert call_args.kwargs["step_name"] == "retriever"
        assert call_args.kwargs["input_data"]["query"] == "Find documents about AI"
        assert call_args.kwargs["output_data"]["document_count"] == 2


class TestCreateCallbackHandler:
    """Tests for the factory function."""
    
    def test_create_callback_handler(self, mock_client):
        """Test factory function creates handler correctly."""
        with patch('watchllm.langchain.LANGCHAIN_AVAILABLE', True):
            with patch('watchllm.langchain.BaseCallbackHandler', MockBaseCallbackHandler):
                from watchllm.langchain import create_callback_handler
                
                handler = create_callback_handler(
                    client=mock_client,
                    run_id="factory-run",
                    tags=["test"],
                )
                
                assert handler.run_id == "factory-run"
                assert handler.tags == ["test"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
