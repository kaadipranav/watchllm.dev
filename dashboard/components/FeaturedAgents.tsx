/**
 * Featured Agents Component
 * Showcases top-performing agents on the homepage
 */

import Link from 'next/link';

const featuredAgents = [
  {
    id: 'lb_1',
    displayName: 'SwiftAgent247',
    displayAuthor: 'Anonymous',
    description: 'Lightning-fast customer support agent with 97% success rate',
    category: 'Customer Support',
    successRate: 0.97,
    avgCostPerTask: 0.0234,
    totalRuns: 15420,
    upvotes: 342,
    rank: 1,
  },
  {
    id: 'lb_2',
    displayName: 'CodeWizard Pro',
    displayAuthor: 'TechCorp',
    description: 'AI-powered code generation and debugging assistant',
    category: 'Code Generation',
    successRate: 0.94,
    avgCostPerTask: 0.0456,
    totalRuns: 8932,
    upvotes: 267,
    rank: 2,
  },
  {
    id: 'lb_3',
    displayName: 'DataInsight AI',
    displayAuthor: 'Anonymous',
    description: 'Advanced data analysis and reporting automation',
    category: 'Data Analysis',
    successRate: 0.91,
    avgCostPerTask: 0.0198,
    totalRuns: 12045,
    upvotes: 189,
    rank: 3,
  },
];

export default function FeaturedAgents() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
            🏆 Featured Agents
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Top-Performing AI Agents
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Discover agents built by our community, optimized for performance and cost efficiency
          </p>
        </div>

        {/* Featured Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {featuredAgents.map((agent, index) => (
            <div
              key={agent.id}
              className="group relative bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300"
            >
              {/* Rank Badge */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>

              {/* Category */}
              <div className="mb-4">
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-medium">
                  {agent.category}
                </span>
              </div>

              {/* Agent Name & Author */}
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {agent.displayName}
              </h3>
              <p className="text-slate-400 text-sm mb-4">by {agent.displayAuthor}</p>

              {/* Description */}
              <p className="text-slate-300 mb-6 line-clamp-2">{agent.description}</p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-400 text-xs mb-1">Success Rate</div>
                  <div className="text-green-500 font-bold text-lg">
                    {(agent.successRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-400 text-xs mb-1">Cost/Task</div>
                  <div className="text-blue-400 font-bold text-lg">
                    ${agent.avgCostPerTask.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-6 text-sm text-slate-400">
                <span>{agent.totalRuns.toLocaleString()} runs</span>
                <span>•</span>
                <span>👍 {agent.upvotes}</span>
              </div>

              {/* View Button */}
              <Link
                href={`/leaderboard/${agent.id}`}
                className="block w-full text-center px-4 py-3 bg-blue-500/10 hover:bg-blue-500 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white rounded-lg font-medium transition-all"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            View Full Leaderboard
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
