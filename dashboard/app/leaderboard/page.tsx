/**
 * Public Leaderboard Page
 * Shows top agents by performance metrics
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Agent Leaderboard | WatchLLM',
  description: 'Discover the top-performing AI agents ranked by success rate, cost efficiency, and performance.',
};

// Mock data - in production, fetch from API
const mockLeaderboardData = [
  {
    id: 'lb_1',
    displayName: 'SwiftAgent247',
    displayAuthor: 'Anonymous',
    category: 'Customer Support',
    tags: ['chatbot', 'support', 'gpt-4'],
    successRate: 0.97,
    avgCostPerTask: 0.0234,
    avgLatencyMs: 1250,
    totalRuns: 15420,
    views: 8234,
    upvotes: 342,
    sharedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'lb_2',
    displayName: 'CodeWizard Pro',
    displayAuthor: 'TechCorp',
    category: 'Code Generation',
    tags: ['coding', 'automation', 'claude'],
    successRate: 0.94,
    avgCostPerTask: 0.0456,
    avgLatencyMs: 2100,
    totalRuns: 8932,
    views: 5123,
    upvotes: 267,
    sharedAt: '2024-01-12T00:00:00Z',
  },
  {
    id: 'lb_3',
    displayName: 'DataInsight AI',
    displayAuthor: 'Anonymous',
    category: 'Data Analysis',
    tags: ['analytics', 'reporting', 'gpt-4'],
    successRate: 0.91,
    avgCostPerTask: 0.0198,
    avgLatencyMs: 890,
    totalRuns: 12045,
    views: 4567,
    upvotes: 189,
    sharedAt: '2024-01-08T00:00:00Z',
  },
  {
    id: 'lb_4',
    displayName: 'QuickResolver',
    displayAuthor: 'StartupXYZ',
    category: 'Customer Support',
    tags: ['support', 'fast', 'efficient'],
    successRate: 0.89,
    avgCostPerTask: 0.0123,
    avgLatencyMs: 650,
    totalRuns: 23456,
    views: 3890,
    upvotes: 156,
    sharedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'lb_5',
    displayName: 'ContentMaster',
    displayAuthor: 'Anonymous',
    category: 'Content Creation',
    tags: ['writing', 'seo', 'marketing'],
    successRate: 0.93,
    avgCostPerTask: 0.0678,
    avgLatencyMs: 3200,
    totalRuns: 5678,
    views: 2345,
    upvotes: 98,
    sharedAt: '2024-01-14T00:00:00Z',
  },
];

const categories = [
  { name: 'All', value: undefined, count: 5 },
  { name: 'Customer Support', value: 'Customer Support', count: 2 },
  { name: 'Code Generation', value: 'Code Generation', count: 1 },
  { name: 'Data Analysis', value: 'Data Analysis', count: 1 },
  { name: 'Content Creation', value: 'Content Creation', count: 1 },
];

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-500">
              WatchLLM
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
            🏆 Community Leaderboard
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Top AI Agents
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Discover the highest-performing agents ranked by success rate, cost efficiency, and community votes
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-1">Public Agents</div>
            <div className="text-3xl font-bold text-white">127</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-1">Total Runs</div>
            <div className="text-3xl font-bold text-white">1.2M+</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-1">Avg Success Rate</div>
            <div className="text-3xl font-bold text-green-500">92.4%</div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                cat.name === 'All'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat.name} {cat.count > 0 && <span className="text-xs opacity-70">({cat.count})</span>}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-slate-400 text-sm">
            Showing <span className="text-white font-medium">5</span> agents
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Sort by:</span>
            <select className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm">
              <option value="popularity">Popularity</option>
              <option value="success_rate">Success Rate</option>
              <option value="cost_efficiency">Cost Efficiency</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-4">
          {mockLeaderboardData.map((entry, index) => (
            <div
              key={entry.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all group"
            >
              <div className="flex items-start justify-between">
                {/* Left: Rank & Info */}
                <div className="flex items-start gap-6 flex-1">
                  {/* Rank Badge */}
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg ${
                      index === 0
                        ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50'
                        : index === 1
                        ? 'bg-slate-400/20 text-slate-300 border-2 border-slate-400/50'
                        : index === 2
                        ? 'bg-orange-500/20 text-orange-400 border-2 border-orange-500/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>

                  {/* Agent Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/leaderboard/${entry.id}`}
                        className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors"
                      >
                        {entry.displayName}
                      </Link>
                      <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400 text-xs font-medium">
                        {entry.category}
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm mb-3">
                      by {entry.displayAuthor}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="grid grid-cols-4 gap-6 ml-6">
                  {/* Success Rate */}
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-1">Success</div>
                    <div className="text-lg font-bold text-green-500">
                      {(entry.successRate * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-1">Cost/Task</div>
                    <div className="text-lg font-bold text-blue-400">
                      ${entry.avgCostPerTask.toFixed(4)}
                    </div>
                  </div>

                  {/* Latency */}
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-1">Latency</div>
                    <div className="text-lg font-bold text-purple-400">
                      {entry.avgLatencyMs}ms
                    </div>
                  </div>

                  {/* Runs */}
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-1">Runs</div>
                    <div className="text-lg font-bold text-slate-300">
                      {entry.totalRuns.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer: Views & Upvotes */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <span>👁️</span>
                  <span>{entry.views.toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <span>👍</span>
                  <span>{entry.upvotes.toLocaleString()} upvotes</span>
                </div>
                <div className="flex-1" />
                <Link
                  href={`/leaderboard/${entry.id}`}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
            Load More Agents
          </button>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 mt-12">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Share Your Agent
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Built an amazing agent? Share it with the community and see how it ranks!
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Get Started →
          </Link>
        </div>
      </div>
    </div>
  );
}
