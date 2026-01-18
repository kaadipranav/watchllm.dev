/**
 * Team Workspace Features
 * 
 * Provides team collaboration capabilities:
 * - User roles (admin/dev/viewer) with permissions
 * - Shareable trace links
 * - Comment system on traces
 * - Slack webhook integration for alerts
 * 
 * @feature TEAM_WORKSPACE
 */

// ============================================================================
// Types - User Roles & Permissions
// ============================================================================

/**
 * User role in a workspace
 */
export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer';

/**
 * Available permissions in the system
 */
export type Permission =
  // Project permissions
  | 'project:read'
  | 'project:write'
  | 'project:delete'
  | 'project:settings'
  // API key permissions
  | 'apikey:read'
  | 'apikey:create'
  | 'apikey:revoke'
  // Trace/run permissions
  | 'trace:read'
  | 'trace:share'
  | 'trace:comment'
  | 'trace:replay'
  | 'trace:delete'
  // Team permissions
  | 'team:read'
  | 'team:invite'
  | 'team:remove'
  | 'team:roles'
  // Settings permissions
  | 'settings:read'
  | 'settings:write'
  | 'billing:read'
  | 'billing:write'
  // Integrations
  | 'integrations:read'
  | 'integrations:write';

/**
 * Role permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    // Full access to everything
    'project:read', 'project:write', 'project:delete', 'project:settings',
    'apikey:read', 'apikey:create', 'apikey:revoke',
    'trace:read', 'trace:share', 'trace:comment', 'trace:replay', 'trace:delete',
    'team:read', 'team:invite', 'team:remove', 'team:roles',
    'settings:read', 'settings:write',
    'billing:read', 'billing:write',
    'integrations:read', 'integrations:write',
  ],
  admin: [
    // Almost full access, except billing and ownership transfer
    'project:read', 'project:write', 'project:settings',
    'apikey:read', 'apikey:create', 'apikey:revoke',
    'trace:read', 'trace:share', 'trace:comment', 'trace:replay', 'trace:delete',
    'team:read', 'team:invite', 'team:remove', 'team:roles',
    'settings:read', 'settings:write',
    'billing:read',
    'integrations:read', 'integrations:write',
  ],
  developer: [
    // Can work with traces and API keys, limited team access
    'project:read',
    'apikey:read', 'apikey:create',
    'trace:read', 'trace:share', 'trace:comment', 'trace:replay',
    'team:read',
    'settings:read',
    'integrations:read',
  ],
  viewer: [
    // Read-only access
    'project:read',
    'trace:read', 'trace:comment',
    'team:read',
    'settings:read',
  ],
};

/**
 * Team member
 */
export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  projectId: string;
  invitedBy?: string;
  invitedAt: string;
  acceptedAt?: string;
  status: 'pending' | 'active' | 'suspended';
}

/**
 * Team invitation
 */
export interface TeamInvitation {
  id: string;
  projectId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

/**
 * Workspace/Project with team info
 */
export interface TeamWorkspace {
  projectId: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  settings: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  allowPublicTraceLinks: boolean;
  defaultShareExpiry: number; // hours, 0 = never
  slackWebhook?: SlackWebhookConfig;
  emailNotifications: boolean;
  commentNotifications: boolean;
}

// ============================================================================
// Types - Shareable Trace Links
// ============================================================================

/**
 * Shareable link for a trace/run
 */
export interface ShareableLink {
  id: string;
  runId: string;
  projectId: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  token: string;
  accessLevel: 'view' | 'comment' | 'full';
  password?: string; // Optional password protection
  viewCount: number;
  lastViewedAt?: string;
  isActive: boolean;
  /** Optional custom message to show */
  message?: string;
  /** Allowed email domains (empty = public) */
  allowedDomains?: string[];
}

/**
 * Share link access log
 */
export interface ShareLinkAccess {
  id: string;
  linkId: string;
  accessedAt: string;
  accessorIp?: string;
  accessorEmail?: string;
  userAgent?: string;
}

// ============================================================================
// Types - Comment System
// ============================================================================

/**
 * Comment on a trace/run
 */
export interface TraceComment {
  id: string;
  runId: string;
  stepIndex?: number; // If commenting on a specific step
  projectId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl?: string;
  content: string;
  /** Markdown formatted content */
  contentHtml?: string;
  createdAt: string;
  updatedAt?: string;
  editedAt?: string;
  isEdited: boolean;
  /** Parent comment ID for threads */
  parentId?: string;
  /** Reaction counts */
  reactions: Record<string, number>;
  /** Mentioned user IDs */
  mentions: string[];
  /** Is this comment resolved (for review-style comments) */
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

/**
 * Comment reaction
 */
export interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

/**
 * Comment mention notification
 */
export interface CommentMention {
  id: string;
  commentId: string;
  mentionedUserId: string;
  mentionedByUserId: string;
  runId: string;
  read: boolean;
  createdAt: string;
}

// ============================================================================
// Types - Slack Integration
// ============================================================================

/**
 * Slack webhook configuration
 */
export interface SlackWebhookConfig {
  webhookUrl: string;
  channel?: string;
  enabled: boolean;
  events: SlackEventType[];
  /** Minimum severity to notify */
  minSeverity: 'info' | 'warning' | 'error' | 'critical';
  /** Daily digest instead of real-time */
  digestMode: boolean;
  digestTime?: string; // HH:MM in UTC
}

export type SlackEventType =
  | 'run_failed'
  | 'run_completed'
  | 'high_cost_alert'
  | 'error_rate_spike'
  | 'new_comment'
  | 'mention'
  | 'team_member_joined'
  | 'team_member_left'
  | 'daily_digest';

/**
 * Slack message payload
 */
export interface SlackMessage {
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export interface SlackBlock {
  type: 'section' | 'header' | 'divider' | 'context' | 'actions';
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: 'plain_text' | 'mrkdwn';
    text: string;
  }>;
  accessory?: {
    type: 'button' | 'image';
    text?: { type: 'plain_text'; text: string };
    url?: string;
    image_url?: string;
    alt_text?: string;
  };
  elements?: Array<{
    type: string;
    text?: { type: string; text: string };
    url?: string;
  }>;
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  ts?: number;
}

// ============================================================================
// Permission Utilities
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has all specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

/**
 * Check if role1 can manage role2 (for role changes)
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  const hierarchy: UserRole[] = ['owner', 'admin', 'developer', 'viewer'];
  const managerIndex = hierarchy.indexOf(managerRole);
  const targetIndex = hierarchy.indexOf(targetRole);
  
  // Can only manage roles below your own (except owner can manage all)
  if (managerRole === 'owner') return true;
  return managerIndex < targetIndex;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    developer: 'Developer',
    viewer: 'Viewer',
  };
  return names[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    owner: 'Full access to everything including billing and ownership transfer',
    admin: 'Can manage team, settings, and all traces',
    developer: 'Can view and replay traces, create API keys',
    viewer: 'Read-only access to traces and comments',
  };
  return descriptions[role] || '';
}

// ============================================================================
// Shareable Link Utilities
// ============================================================================

/**
 * Generate a secure share token
 */
export function generateShareToken(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomUUID().replace(/-/g, '');
  return `share_${timestamp}_${random.substring(0, 16)}`;
}

/**
 * Generate an invitation token
 */
export function generateInviteToken(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomUUID().replace(/-/g, '');
  return `invite_${timestamp}_${random.substring(0, 20)}`;
}

/**
 * Create a shareable link
 */
export function createShareableLink(
  runId: string,
  projectId: string,
  createdBy: string,
  options: {
    accessLevel?: ShareableLink['accessLevel'];
    expiresInHours?: number;
    password?: string;
    message?: string;
    allowedDomains?: string[];
  } = {}
): ShareableLink {
  const now = new Date();
  const expiresAt = options.expiresInHours
    ? new Date(now.getTime() + options.expiresInHours * 60 * 60 * 1000).toISOString()
    : undefined;

  return {
    id: `link_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`,
    runId,
    projectId,
    createdBy,
    createdAt: now.toISOString(),
    expiresAt,
    token: generateShareToken(),
    accessLevel: options.accessLevel || 'view',
    password: options.password,
    viewCount: 0,
    isActive: true,
    message: options.message,
    allowedDomains: options.allowedDomains,
  };
}

/**
 * Check if a share link is valid
 */
export function isShareLinkValid(link: ShareableLink): boolean {
  if (!link.isActive) return false;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return false;
  return true;
}

/**
 * Check if email domain is allowed for a share link
 */
export function isDomainAllowed(link: ShareableLink, email: string): boolean {
  if (!link.allowedDomains || link.allowedDomains.length === 0) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  return link.allowedDomains.some(d => d.toLowerCase() === domain);
}

/**
 * Generate the share URL
 */
export function getShareUrl(link: ShareableLink, baseUrl: string): string {
  return `${baseUrl}/shared/${link.token}`;
}

// ============================================================================
// Comment Utilities
// ============================================================================

/**
 * Create a new comment
 */
export function createComment(
  runId: string,
  projectId: string,
  author: { id: string; name: string; email: string; avatarUrl?: string },
  content: string,
  options: {
    stepIndex?: number;
    parentId?: string;
  } = {}
): TraceComment {
  const mentions = extractMentions(content);
  
  return {
    id: `comment_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    runId,
    stepIndex: options.stepIndex,
    projectId,
    authorId: author.id,
    authorName: author.name,
    authorEmail: author.email,
    authorAvatarUrl: author.avatarUrl,
    content,
    createdAt: new Date().toISOString(),
    isEdited: false,
    parentId: options.parentId,
    reactions: {},
    mentions,
    isResolved: false,
  };
}

/**
 * Extract @mentions from comment content
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // User ID
  }
  
  return mentions;
}

/**
 * Format comment content for display (render mentions)
 */
export function formatCommentContent(
  content: string,
  userMap: Map<string, { name: string; email: string }>
): string {
  return content.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    (_, name, userId) => {
      const user = userMap.get(userId);
      return `<span class="mention" data-user-id="${userId}">@${user?.name || name}</span>`;
    }
  );
}

/**
 * Create comment thread summary
 */
export function getThreadSummary(comments: TraceComment[]): {
  total: number;
  resolved: number;
  unresolved: number;
  participants: string[];
} {
  const topLevel = comments.filter(c => !c.parentId);
  const participants = [...new Set(comments.map(c => c.authorId))];
  
  return {
    total: topLevel.length,
    resolved: topLevel.filter(c => c.isResolved).length,
    unresolved: topLevel.filter(c => !c.isResolved).length,
    participants,
  };
}

// ============================================================================
// Slack Integration Utilities
// ============================================================================

/**
 * Send a message to Slack webhook
 */
export async function sendSlackMessage(
  webhookUrl: string,
  message: SlackMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Slack API error: ${response.status} - ${text}` };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create a Slack message for run failure
 */
export function createRunFailedSlackMessage(
  runId: string,
  agentName: string,
  error: string,
  dashboardUrl: string
): SlackMessage {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔴 Agent Run Failed',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Agent:*\n${agentName}` },
          { type: 'mrkdwn', text: `*Run ID:*\n\`${runId}\`` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:*\n\`\`\`${error.substring(0, 500)}\`\`\``,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Run Details' },
            url: `${dashboardUrl}/dashboard/observability/agent-runs/${runId}/debug`,
          },
        ],
      },
    ],
  };
}

/**
 * Create a Slack message for high cost alert
 */
export function createHighCostAlertSlackMessage(
  projectName: string,
  currentCost: number,
  threshold: number,
  period: string,
  dashboardUrl: string
): SlackMessage {
  const percentOver = ((currentCost - threshold) / threshold * 100).toFixed(1);
  
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '💰 High Cost Alert',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Project *${projectName}* has exceeded its cost threshold by *${percentOver}%*`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Current Cost:*\n$${currentCost.toFixed(2)}` },
          { type: 'mrkdwn', text: `*Threshold:*\n$${threshold.toFixed(2)}` },
          { type: 'mrkdwn', text: `*Period:*\n${period}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Usage' },
            url: `${dashboardUrl}/dashboard/usage`,
          },
        ],
      },
    ],
    attachments: [
      {
        color: '#dc2626', // Red
        footer: 'WatchLLM Cost Alerts',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Create a Slack message for error rate spike
 */
export function createErrorRateSpikeSlackMessage(
  projectName: string,
  errorRate: number,
  normalRate: number,
  period: string,
  dashboardUrl: string
): SlackMessage {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ Error Rate Spike Detected',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Project *${projectName}* is experiencing elevated error rates`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Current Error Rate:*\n${errorRate.toFixed(1)}%` },
          { type: 'mrkdwn', text: `*Normal Rate:*\n${normalRate.toFixed(1)}%` },
          { type: 'mrkdwn', text: `*Period:*\n${period}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Logs' },
            url: `${dashboardUrl}/dashboard/observability/logs?status=error`,
          },
        ],
      },
    ],
    attachments: [
      {
        color: '#f59e0b', // Amber
        footer: 'WatchLLM Error Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Create a Slack message for new comment
 */
export function createNewCommentSlackMessage(
  comment: TraceComment,
  runName: string,
  dashboardUrl: string
): SlackMessage {
  const stepInfo = comment.stepIndex !== undefined 
    ? ` on Step ${comment.stepIndex}` 
    : '';
  
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `💬 *${comment.authorName}* commented${stepInfo} on run *${runName}*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `> ${comment.content.substring(0, 300)}${comment.content.length > 300 ? '...' : ''}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${dashboardUrl}/dashboard/observability/agent-runs/${comment.runId}/debug|View Run>`,
          },
        ],
      },
    ],
  };
}

/**
 * Create daily digest Slack message
 */
export function createDailyDigestSlackMessage(
  projectName: string,
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    totalCost: number;
    cacheSavings: number;
    topAgents: Array<{ name: string; runs: number; cost: number }>;
  },
  dashboardUrl: string
): SlackMessage {
  const successRate = stats.totalRuns > 0 
    ? ((stats.successfulRuns / stats.totalRuns) * 100).toFixed(1) 
    : '0';

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📊 Daily Digest: ${projectName}`,
          emoji: true,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Total Runs:*\n${stats.totalRuns.toLocaleString()}` },
          { type: 'mrkdwn', text: `*Success Rate:*\n${successRate}%` },
          { type: 'mrkdwn', text: `*Total Cost:*\n$${stats.totalCost.toFixed(2)}` },
          { type: 'mrkdwn', text: `*Cache Savings:*\n$${stats.cacheSavings.toFixed(2)}` },
        ],
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Top Agents by Usage:*\n' + stats.topAgents
            .slice(0, 5)
            .map((a, i) => `${i + 1}. ${a.name}: ${a.runs} runs ($${a.cost.toFixed(2)})`)
            .join('\n'),
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Full Report' },
            url: `${dashboardUrl}/dashboard/analytics`,
          },
        ],
      },
    ],
  };
}

/**
 * Check if an event should trigger a Slack notification
 */
export function shouldNotifySlack(
  config: SlackWebhookConfig,
  eventType: SlackEventType,
  severity: 'info' | 'warning' | 'error' | 'critical'
): boolean {
  if (!config.enabled) return false;
  if (!config.events.includes(eventType)) return false;
  
  const severityLevels = ['info', 'warning', 'error', 'critical'];
  const minLevel = severityLevels.indexOf(config.minSeverity);
  const eventLevel = severityLevels.indexOf(severity);
  
  return eventLevel >= minLevel;
}

// ============================================================================
// In-Memory Stores (for development/testing)
// ============================================================================

/**
 * In-memory team member store
 */
export class TeamMemberStore {
  private members: Map<string, TeamMember> = new Map();
  private byProject: Map<string, Set<string>> = new Map();
  private byUser: Map<string, Set<string>> = new Map();

  add(member: TeamMember): void {
    this.members.set(member.id, member);
    
    // Index by project
    if (!this.byProject.has(member.projectId)) {
      this.byProject.set(member.projectId, new Set());
    }
    this.byProject.get(member.projectId)!.add(member.id);
    
    // Index by user
    if (!this.byUser.has(member.userId)) {
      this.byUser.set(member.userId, new Set());
    }
    this.byUser.get(member.userId)!.add(member.id);
  }

  get(id: string): TeamMember | undefined {
    return this.members.get(id);
  }

  getByProject(projectId: string): TeamMember[] {
    const ids = this.byProject.get(projectId) || new Set();
    return Array.from(ids)
      .map(id => this.members.get(id))
      .filter((m): m is TeamMember => m !== undefined);
  }

  getByUser(userId: string): TeamMember[] {
    const ids = this.byUser.get(userId) || new Set();
    return Array.from(ids)
      .map(id => this.members.get(id))
      .filter((m): m is TeamMember => m !== undefined);
  }

  getMemberRole(projectId: string, userId: string): UserRole | null {
    const members = this.getByProject(projectId);
    const member = members.find(m => m.userId === userId);
    return member?.role || null;
  }

  updateRole(id: string, newRole: UserRole): boolean {
    const member = this.members.get(id);
    if (!member) return false;
    member.role = newRole;
    return true;
  }

  remove(id: string): boolean {
    const member = this.members.get(id);
    if (!member) return false;
    
    this.byProject.get(member.projectId)?.delete(id);
    this.byUser.get(member.userId)?.delete(id);
    return this.members.delete(id);
  }

  getSize(): number {
    return this.members.size;
  }
}

/**
 * In-memory share link store
 */
export class ShareLinkStore {
  private links: Map<string, ShareableLink> = new Map();
  private byToken: Map<string, string> = new Map();
  private byRun: Map<string, Set<string>> = new Map();

  add(link: ShareableLink): void {
    this.links.set(link.id, link);
    this.byToken.set(link.token, link.id);
    
    if (!this.byRun.has(link.runId)) {
      this.byRun.set(link.runId, new Set());
    }
    this.byRun.get(link.runId)!.add(link.id);
  }

  get(id: string): ShareableLink | undefined {
    return this.links.get(id);
  }

  getByToken(token: string): ShareableLink | undefined {
    const id = this.byToken.get(token);
    return id ? this.links.get(id) : undefined;
  }

  getByRun(runId: string): ShareableLink[] {
    const ids = this.byRun.get(runId) || new Set();
    return Array.from(ids)
      .map(id => this.links.get(id))
      .filter((l): l is ShareableLink => l !== undefined);
  }

  recordAccess(token: string): boolean {
    const link = this.getByToken(token);
    if (!link) return false;
    link.viewCount++;
    link.lastViewedAt = new Date().toISOString();
    return true;
  }

  deactivate(id: string): boolean {
    const link = this.links.get(id);
    if (!link) return false;
    link.isActive = false;
    return true;
  }

  getSize(): number {
    return this.links.size;
  }
}

/**
 * In-memory comment store
 */
export class CommentStore {
  private comments: Map<string, TraceComment> = new Map();
  private byRun: Map<string, string[]> = new Map();

  add(comment: TraceComment): void {
    this.comments.set(comment.id, comment);
    
    if (!this.byRun.has(comment.runId)) {
      this.byRun.set(comment.runId, []);
    }
    this.byRun.get(comment.runId)!.push(comment.id);
  }

  get(id: string): TraceComment | undefined {
    return this.comments.get(id);
  }

  getByRun(runId: string): TraceComment[] {
    const ids = this.byRun.get(runId) || [];
    return ids
      .map(id => this.comments.get(id))
      .filter((c): c is TraceComment => c !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getByStep(runId: string, stepIndex: number): TraceComment[] {
    return this.getByRun(runId).filter(c => c.stepIndex === stepIndex);
  }

  update(id: string, content: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;
    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date().toISOString();
    comment.updatedAt = new Date().toISOString();
    return true;
  }

  addReaction(id: string, emoji: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;
    comment.reactions[emoji] = (comment.reactions[emoji] || 0) + 1;
    return true;
  }

  removeReaction(id: string, emoji: string): boolean {
    const comment = this.comments.get(id);
    if (!comment || !comment.reactions[emoji]) return false;
    comment.reactions[emoji]--;
    if (comment.reactions[emoji] <= 0) delete comment.reactions[emoji];
    return true;
  }

  resolve(id: string, resolvedBy: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;
    comment.isResolved = true;
    comment.resolvedBy = resolvedBy;
    comment.resolvedAt = new Date().toISOString();
    return true;
  }

  unresolve(id: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;
    comment.isResolved = false;
    comment.resolvedBy = undefined;
    comment.resolvedAt = undefined;
    return true;
  }

  delete(id: string): boolean {
    const comment = this.comments.get(id);
    if (!comment) return false;
    
    const runComments = this.byRun.get(comment.runId);
    if (runComments) {
      const idx = runComments.indexOf(id);
      if (idx >= 0) runComments.splice(idx, 1);
    }
    
    return this.comments.delete(id);
  }

  getSize(): number {
    return this.comments.size;
  }
}

// ============================================================================
// Exports
// ============================================================================

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  allowPublicTraceLinks: false,
  defaultShareExpiry: 24, // 24 hours
  emailNotifications: true,
  commentNotifications: true,
};

export const DEFAULT_SLACK_CONFIG: SlackWebhookConfig = {
  webhookUrl: '',
  enabled: false,
  events: ['run_failed', 'high_cost_alert', 'error_rate_spike'],
  minSeverity: 'warning',
  digestMode: false,
};
