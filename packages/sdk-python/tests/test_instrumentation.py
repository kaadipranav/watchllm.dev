"""
Tests for the auto-instrumentation module.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import threading
import time


class TestAutoInstrumentConfiguration:
    """Tests for auto_instrument configuration and setup."""

    def test_auto_instrument_returns_client(self):
        """auto_instrument should return a WatchLLMClient."""
        from watchllm.instrumentation import auto_instrument, disable_instrumentation
        from watchllm import WatchLLMClient
        
        client = auto_instrument(api_key="test-key", project_id="test-project")
        
        assert client is not None
        assert isinstance(client, WatchLLMClient)
        
        disable_instrumentation()

    def test_disable_instrumentation(self):
        """disable_instrumentation should reset state."""
        from watchllm.instrumentation import (
            auto_instrument, 
            disable_instrumentation, 
            is_instrumented
        )
        
        # Enable first
        auto_instrument(api_key="test-key", project_id="test-project")
        assert is_instrumented() is True
        
        # Now disable
        disable_instrumentation()
        assert is_instrumented() is False

    def test_get_client_returns_none_when_not_instrumented(self):
        """get_client should return None when not instrumented."""
        from watchllm.instrumentation import get_client, disable_instrumentation
        
        disable_instrumentation()
        assert get_client() is None

    def test_get_client_returns_client_when_instrumented(self):
        """get_client should return the client when instrumented."""
        from watchllm.instrumentation import (
            auto_instrument, 
            get_client, 
            disable_instrumentation
        )
        from watchllm import WatchLLMClient
        
        auto_instrument(api_key="test-key", project_id="test-project")
        client = get_client()
        
        assert client is not None
        assert isinstance(client, WatchLLMClient)
        
        disable_instrumentation()

    def test_is_instrumented_true_after_enable(self):
        """is_instrumented should return True after auto_instrument."""
        from watchllm.instrumentation import (
            auto_instrument, 
            is_instrumented, 
            disable_instrumentation
        )
        
        disable_instrumentation()
        assert is_instrumented() is False
        
        auto_instrument(api_key="test-key", project_id="test-project")
        assert is_instrumented() is True
        
        disable_instrumentation()

    def test_auto_instrument_with_custom_client_kwargs(self):
        """auto_instrument should pass kwargs to WatchLLMClient."""
        from watchllm.instrumentation import (
            auto_instrument, 
            get_client, 
            disable_instrumentation
        )
        
        auto_instrument(
            api_key="test-key", 
            project_id="test-project",
            environment="test",
            sample_rate=0.5
        )
        
        client = get_client()
        assert client is not None
        # The client should have these settings
        
        disable_instrumentation()


class TestTraceContextManager:
    """Tests for the trace context manager."""

    def test_trace_yields_run_id(self):
        """trace should yield the run_id."""
        from watchllm.instrumentation import (
            auto_instrument, 
            trace, 
            disable_instrumentation
        )
        
        auto_instrument(api_key="test-key", project_id="test-project")
        
        with trace(run_id="my-run-123") as run_id:
            assert run_id == "my-run-123"
        
        disable_instrumentation()

    def test_trace_generates_run_id_if_not_provided(self):
        """trace should generate a run_id if not provided."""
        from watchllm.instrumentation import (
            auto_instrument, 
            trace, 
            disable_instrumentation
        )
        
        auto_instrument(api_key="test-key", project_id="test-project")
        
        with trace() as run_id:
            assert run_id is not None
            assert len(run_id) > 0
        
        disable_instrumentation()

    def test_trace_without_instrumentation(self):
        """trace should work even without instrumentation (no-op)."""
        from watchllm.instrumentation import trace, disable_instrumentation
        
        disable_instrumentation()
        
        # Should not raise
        with trace(run_id="test") as run_id:
            assert run_id == "test"

    def test_trace_with_user_id_and_tags(self):
        """trace should accept user_id and tags."""
        from watchllm.instrumentation import (
            auto_instrument, 
            trace, 
            disable_instrumentation
        )
        
        auto_instrument(api_key="test-key", project_id="test-project")
        
        # Should not raise
        with trace(run_id="test", user_id="user-123", tags=["prod", "v2"]) as run_id:
            assert run_id == "test"
        
        disable_instrumentation()


class TestCostCalculation:
    """Tests for cost calculation functions."""

    def test_calculate_cost_gpt4o(self):
        """Should calculate cost for GPT-4o correctly."""
        from watchllm.instrumentation import calculate_cost
        
        cost = calculate_cost("gpt-4o", 1000, 500)
        # GPT-4o: $0.0025/1K input, $0.01/1K output
        expected = (1000 * 0.0025 / 1000) + (500 * 0.01 / 1000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_gpt35_turbo(self):
        """Should calculate cost for GPT-3.5-turbo correctly."""
        from watchllm.instrumentation import calculate_cost
        
        cost = calculate_cost("gpt-3.5-turbo", 2000, 1000)
        # GPT-3.5-turbo: $0.0005/1K input, $0.0015/1K output
        expected = (2000 * 0.0005 / 1000) + (1000 * 0.0015 / 1000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_claude_sonnet(self):
        """Should calculate cost for Claude 3.5 Sonnet correctly."""
        from watchllm.instrumentation import calculate_cost
        
        cost = calculate_cost("claude-3-5-sonnet-20241022", 5000, 2000)
        # Claude 3.5 Sonnet: $0.003/1K input, $0.015/1K output
        expected = (5000 * 0.003 / 1000) + (2000 * 0.015 / 1000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_unknown_model_uses_fallback(self):
        """Should use fallback pricing for unknown models."""
        from watchllm.instrumentation import calculate_cost
        
        # Unknown model should still return a cost (using fallback)
        cost = calculate_cost("unknown-model-xyz", 1000, 500)
        # Fallback: $0.001/1K input, $0.002/1K output
        expected = (1000 * 0.001 / 1000) + (500 * 0.002 / 1000)
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_embeddings(self):
        """Should calculate embedding costs correctly."""
        from watchllm.instrumentation import calculate_cost
        
        cost = calculate_cost("text-embedding-3-small", 10000, 0)
        # text-embedding-3-small: $0.00002/1K input
        expected = 10000 * 0.00002 / 1000
        assert abs(cost - expected) < 0.0001

    def test_calculate_cost_claude_opus(self):
        """Should calculate cost for Claude 3 Opus correctly."""
        from watchllm.instrumentation import calculate_cost
        
        cost = calculate_cost("claude-3-opus-20240229", 1000, 500)
        # Claude 3 Opus: $0.015/1K input, $0.075/1K output
        expected = (1000 * 0.015 / 1000) + (500 * 0.075 / 1000)
        assert abs(cost - expected) < 0.0001


class TestMessageExtraction:
    """Tests for message content extraction."""

    def test_extract_openai_messages_simple(self):
        """Should extract simple string messages."""
        from watchllm.instrumentation import _extract_openai_messages
        
        messages = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"}
        ]
        result = _extract_openai_messages(messages)
        assert "[user]: Hello" in result
        assert "[assistant]: Hi there!" in result

    def test_extract_openai_messages_multimodal(self):
        """Should handle multimodal content (vision, etc.)."""
        from watchllm.instrumentation import _extract_openai_messages
        
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What's in this image?"},
                    {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
                ]
            }
        ]
        result = _extract_openai_messages(messages)
        assert "What's in this image?" in result

    def test_extract_openai_messages_empty(self):
        """Should handle empty messages."""
        from watchllm.instrumentation import _extract_openai_messages
        
        result = _extract_openai_messages([])
        assert result == ""


class TestResponseExtraction:
    """Tests for response content extraction."""

    def test_extract_openai_response_chat(self):
        """Should extract content from OpenAI chat response format."""
        from watchllm.instrumentation import _extract_openai_response
        
        # Mock OpenAI response
        response = Mock()
        choice = Mock()
        choice.message = Mock()
        choice.message.content = "Hello, how can I help?"
        response.choices = [choice]
        
        result = _extract_openai_response(response)
        assert result == "Hello, how can I help?"

    def test_extract_openai_response_empty(self):
        """Should handle empty response gracefully."""
        from watchllm.instrumentation import _extract_openai_response
        
        response = Mock()
        response.choices = []
        
        result = _extract_openai_response(response)
        assert result == ""


class TestUsageExtraction:
    """Tests for token usage extraction."""

    def test_extract_openai_usage(self):
        """Should extract usage from OpenAI response."""
        from watchllm.instrumentation import _extract_openai_usage
        
        response = Mock()
        response.usage = Mock()
        response.usage.prompt_tokens = 100
        response.usage.completion_tokens = 50
        response.usage.total_tokens = 150
        
        result = _extract_openai_usage(response)
        assert result["input"] == 100
        assert result["output"] == 50
        assert result["total"] == 150

    def test_extract_openai_usage_missing(self):
        """Should handle missing usage gracefully."""
        from watchllm.instrumentation import _extract_openai_usage
        
        response = Mock()
        response.usage = None
        
        result = _extract_openai_usage(response)
        assert result["input"] == 0
        assert result["output"] == 0
        assert result["total"] == 0


class TestIntegrationScenarios:
    """Integration tests for common scenarios."""

    def test_basic_instrumentation_flow(self):
        """Test basic instrumentation setup and teardown."""
        from watchllm import (
            auto_instrument, 
            disable_instrumentation, 
            is_instrumented,
            get_client
        )
        
        # Initially not instrumented (clean state)
        disable_instrumentation()
        assert is_instrumented() is False
        
        # Enable
        auto_instrument(api_key="test-key", project_id="test-project")
        assert is_instrumented() is True
        assert get_client() is not None
        
        # Disable
        disable_instrumentation()
        assert is_instrumented() is False
        assert get_client() is None

    def test_multiple_enable_disable_cycles(self):
        """Test enabling and disabling multiple times."""
        from watchllm.instrumentation import (
            auto_instrument, 
            disable_instrumentation, 
            is_instrumented
        )
        
        for i in range(3):
            auto_instrument(api_key="test-key", project_id="test-project")
            assert is_instrumented() is True
            
            disable_instrumentation()
            assert is_instrumented() is False

    def test_get_current_run_id_without_context(self):
        """get_current_run_id should generate UUID when no context."""
        from watchllm.instrumentation import get_current_run_id
        
        run_id = get_current_run_id()
        assert run_id is not None
        assert len(run_id) == 36  # UUID format

    def test_get_current_run_id_with_trace_context(self):
        """get_current_run_id should return context run_id when in trace."""
        from watchllm.instrumentation import (
            auto_instrument, 
            trace, 
            get_current_run_id,
            disable_instrumentation
        )
        
        auto_instrument(api_key="test-key", project_id="test-project")
        
        with trace(run_id="my-custom-run"):
            assert get_current_run_id() == "my-custom-run"
        
        disable_instrumentation()


class TestExports:
    """Tests for module exports."""

    def test_exports_from_main_module(self):
        """All instrumentation functions should be exported from main module."""
        import watchllm
        
        assert hasattr(watchllm, 'auto_instrument')
        assert hasattr(watchllm, 'disable_instrumentation')
        assert hasattr(watchllm, 'is_instrumented')
        assert hasattr(watchllm, 'get_client')
        assert hasattr(watchllm, 'trace')

    def test_exports_in_all(self):
        """All exports should be in __all__."""
        import watchllm
        
        assert 'auto_instrument' in watchllm.__all__
        assert 'disable_instrumentation' in watchllm.__all__
        assert 'is_instrumented' in watchllm.__all__
        assert 'get_client' in watchllm.__all__
        assert 'trace' in watchllm.__all__

    def test_direct_import_from_instrumentation(self):
        """Functions should be importable directly from instrumentation module."""
        from watchllm.instrumentation import (
            auto_instrument,
            disable_instrumentation,
            is_instrumented,
            get_client,
            trace,
            calculate_cost,
            get_current_run_id,
        )
        
        # All should be callable
        assert callable(auto_instrument)
        assert callable(disable_instrumentation)
        assert callable(is_instrumented)
        assert callable(get_client)
        assert callable(trace)
        assert callable(calculate_cost)
        assert callable(get_current_run_id)


class TestModelPricing:
    """Tests for model pricing coverage."""

    def test_openai_models_have_pricing(self):
        """All common OpenAI models should have pricing."""
        from watchllm.instrumentation import MODEL_PRICING
        
        openai_models = [
            "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4",
            "gpt-3.5-turbo", "o1", "o1-mini"
        ]
        
        for model in openai_models:
            assert model in MODEL_PRICING, f"Missing pricing for {model}"
            assert "input" in MODEL_PRICING[model]
            assert "output" in MODEL_PRICING[model]

    def test_anthropic_models_have_pricing(self):
        """All common Anthropic models should have pricing."""
        from watchllm.instrumentation import MODEL_PRICING
        
        anthropic_models = [
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20240229",
            "claude-3-haiku-20240307",
        ]
        
        for model in anthropic_models:
            assert model in MODEL_PRICING, f"Missing pricing for {model}"
            assert "input" in MODEL_PRICING[model]
            assert "output" in MODEL_PRICING[model]

    def test_embedding_models_have_pricing(self):
        """Embedding models should have pricing."""
        from watchllm.instrumentation import MODEL_PRICING
        
        embedding_models = [
            "text-embedding-3-small",
            "text-embedding-3-large",
            "text-embedding-ada-002",
        ]
        
        for model in embedding_models:
            assert model in MODEL_PRICING, f"Missing pricing for {model}"
            assert "input" in MODEL_PRICING[model]
            # Embedding models have 0 output cost
            assert MODEL_PRICING[model]["output"] == 0
