/**
 * OG Image Generation for Leaderboard Entries
 * Using Vercel OG (next/og) for dynamic social sharing images
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const agentName = searchParams.get('name') || 'AI Agent';
    const author = searchParams.get('author') || 'Anonymous';
    const successRate = searchParams.get('successRate') || '0';
    const avgCost = searchParams.get('avgCost') || '0';
    const totalRuns = searchParams.get('totalRuns') || '0';
    const category = searchParams.get('category') || 'General';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
            padding: '60px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 28,
                color: '#94a3b8',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              🏆 Agent Leaderboard
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 1.1,
                marginBottom: 24,
              }}
            >
              {agentName}
            </div>
            <div
              style={{
                fontSize: 32,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              by {author} • {category}
            </div>
          </div>

          {/* Metrics Grid */}
          <div
            style={{
              display: 'flex',
              gap: 32,
              marginTop: 40,
              marginBottom: 40,
            }}
          >
            {/* Success Rate */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '32px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '16px',
                border: '2px solid rgba(34, 197, 94, 0.3)',
                minWidth: 280,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  color: '#86efac',
                  marginBottom: 8,
                }}
              >
                Success Rate
              </div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 'bold',
                  color: '#22c55e',
                }}
              >
                {successRate}%
              </div>
            </div>

            {/* Avg Cost */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '32px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '16px',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                minWidth: 280,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  color: '#93c5fd',
                  marginBottom: 8,
                }}
              >
                Avg Cost/Task
              </div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 'bold',
                  color: '#3b82f6',
                }}
              >
                ${avgCost}
              </div>
            </div>

            {/* Total Runs */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '32px',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '16px',
                border: '2px solid rgba(168, 85, 247, 0.3)',
                minWidth: 280,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  color: '#d8b4fe',
                  marginBottom: 8,
                }}
              >
                Total Runs
              </div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 'bold',
                  color: '#a855f7',
                }}
              >
                {totalRuns}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              WatchLLM
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#64748b',
              }}
            >
              watchllm.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
