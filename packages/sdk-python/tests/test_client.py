import unittest
from unittest.mock import patch, MagicMock
import json
import time
import sys
import os

# Add src to path to import watchllm
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from watchllm.client import WatchLLMClient, init, EventType, Status

class TestWatchLLMClient(unittest.TestCase):
    def setUp(self):
        self.api_key = "test_key"
        self.project_id = "test_project"
        self.client = init(
            api_key=self.api_key,
            project_id=self.project_id,
            flush_interval_seconds=0.1  # Fast flush for tests
        )

    def tearDown(self):
        self.client.close()

    @patch('watchllm.client.requests.Session')
    def test_log_prompt_call(self, mock_session_cls):
        # Setup mock
        mock_session = mock_session_cls.return_value
        mock_response = MagicMock()
        mock_response.json.return_value = {"success": True}
        mock_response.status_code = 200
        mock_session.post.return_value = mock_response

        # Log event
        self.client.log_prompt_call(
            run_id="run-123",
            prompt="Hello world",
            model="gpt-4o",
            response="Hi there",
            tokens_input=10,
            tokens_output=5,
            latency_ms=100
        )

        # Force flush
        self.client.flush()

        # Verify call
        mock_session.post.assert_called_once()
        args, kwargs = mock_session.post.call_args
        
        self.assertIn('/events/batch', args[0])
        self.assertEqual(kwargs['headers']['Authorization'], 'Bearer test_key')
        
        body = kwargs['json']
        self.assertEqual(len(body['events']), 1)
        event = body['events'][0]
        
        self.assertEqual(event['event_type'], 'prompt_call')
        self.assertEqual(event['model'], 'gpt-4o')
        self.assertEqual(event['tokens_input'], 10)
        # Check if cost was calculated (gpt-4o input=0.005/1k, output=0.015/1k)
        # (10 * 0.005 + 5 * 0.015) / 1000 = (0.05 + 0.075) / 1000 = 0.125 / 1000 = 0.000125
        self.assertAlmostEqual(event['cost_estimate_usd'], 0.000125)

    @patch('watchllm.client.requests.Session')
    def test_batching(self, mock_session_cls):
        mock_session = mock_session_cls.return_value
        mock_session.post.return_value.status_code = 200

        # Create client with batch size 2
        client = WatchLLMClient(
            api_key="k", project_id="p", batch_size=2, flush_interval_seconds=10
        )

        try:
            client.log_prompt_call(run_id="1", prompt="p1", model="m", response="r", tokens_input=1, tokens_output=1, latency_ms=1)
            
            # Should not have flushed yet (size 1 < 2)
            mock_session.post.assert_not_called()

            client.log_prompt_call(run_id="2", prompt="p2", model="m", response="r", tokens_input=1, tokens_output=1, latency_ms=1)
            
            # Should flush automatically soon (since size >= 2). 
            # However, the flush is in a background thread, so we wait briefly.
            time.sleep(1.5) 
            
            mock_session.post.assert_called()
            args, kwargs = mock_session.post.call_args
            self.assertEqual(len(kwargs['json']['events']), 2)
            
        finally:
            client.close()

    def test_pii_redaction(self):
        client = WatchLLMClient("k", "p", redact_pii=True)
        
        event_dict = {
            "email": "user@example.com", 
            "text": "Call me at 555-123-4567 or email test@test.org"
        }
        
        redacted = client._redact_pii(event_dict)
        
        self.assertEqual(redacted['email'], "[REDACTED_EMAIL]")
        self.assertIn("[REDACTED_EMAIL]", redacted['text'])
        client.close()

if __name__ == '__main__':
    unittest.main()
