/**
 * Team Workspace Feature Tests
 * 
 * Tests for:
 * - User roles and permissions
 * - Shareable trace links
 * - Comment system
 * - Slack webhook integration
 * 
 * @feature TEAM_WORKSPACE
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Types
  type UserRole,
  type Permission,
  type TeamMember,
  type ShareableLink,
  type TraceComment,
  type SlackWebhookConfig,
  type SlackMessage,
  // Permission utilities
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  canManageRole,
  getRoleDisplayName,
  getRoleDescription,
  ROLE_PERMISSIONS,
  // Share link utilities
  generateShareToken,
  generateInviteToken,
  createShareableLink,
  isShareLinkValid,
  isDomainAllowed,
  getShareUrl,
  // Comment utilities
  createComment,
  extractMentions,
  formatCommentContent,
  getThreadSummary,
  // Slack utilities
  createRunFailedSlackMessage,
  createHighCostAlertSlackMessage,
  createErrorRateSpikeSlackMessage,
  createNewCommentSlackMessage,
  createDailyDigestSlackMessage,
  shouldNotifySlack,
  // Stores
  TeamMemberStore,
  ShareLinkStore,
  CommentStore,
  // Defaults
  DEFAULT_WORKSPACE_SETTINGS,
  DEFAULT_SLACK_CONFIG,
} from '../teamWorkspace';

// ============================================================================
// Permission Tests
// ============================================================================

describe('User Roles and Permissions', () => {
  describe('hasPermission', () => {
    it('should return true for owner having all permissions', () => {
      expect(hasPermission('owner', 'project:read')).toBe(true);
      expect(hasPermission('owner', 'project:delete')).toBe(true);
      expect(hasPermission('owner', 'billing:write')).toBe(true);
      expect(hasPermission('owner', 'team:roles')).toBe(true);
    });

    it('should return true for admin having most permissions', () => {
      expect(hasPermission('admin', 'project:read')).toBe(true);
      expect(hasPermission('admin', 'project:write')).toBe(true);
      expect(hasPermission('admin', 'trace:delete')).toBe(true);
      expect(hasPermission('admin', 'team:invite')).toBe(true);
    });

    it('should return false for admin not having billing:write', () => {
      expect(hasPermission('admin', 'billing:write')).toBe(false);
      expect(hasPermission('admin', 'project:delete')).toBe(false);
    });

    it('should return true for developer having limited permissions', () => {
      expect(hasPermission('developer', 'project:read')).toBe(true);
      expect(hasPermission('developer', 'trace:read')).toBe(true);
      expect(hasPermission('developer', 'trace:replay')).toBe(true);
      expect(hasPermission('developer', 'apikey:create')).toBe(true);
    });

    it('should return false for developer lacking admin permissions', () => {
      expect(hasPermission('developer', 'project:delete')).toBe(false);
      expect(hasPermission('developer', 'trace:delete')).toBe(false);
      expect(hasPermission('developer', 'team:invite')).toBe(false);
    });

    it('should return true for viewer having read-only permissions', () => {
      expect(hasPermission('viewer', 'project:read')).toBe(true);
      expect(hasPermission('viewer', 'trace:read')).toBe(true);
      expect(hasPermission('viewer', 'trace:comment')).toBe(true);
      expect(hasPermission('viewer', 'team:read')).toBe(true);
    });

    it('should return false for viewer lacking write permissions', () => {
      expect(hasPermission('viewer', 'project:write')).toBe(false);
      expect(hasPermission('viewer', 'trace:replay')).toBe(false);
      expect(hasPermission('viewer', 'apikey:create')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when role has all listed permissions', () => {
      expect(hasAllPermissions('owner', ['project:read', 'project:write', 'billing:write'])).toBe(true);
      expect(hasAllPermissions('developer', ['project:read', 'trace:read', 'trace:replay'])).toBe(true);
    });

    it('should return false when role lacks any of the listed permissions', () => {
      expect(hasAllPermissions('admin', ['project:read', 'billing:write'])).toBe(false);
      expect(hasAllPermissions('viewer', ['trace:read', 'trace:replay'])).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      expect(hasAllPermissions('viewer', [])).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when role has at least one listed permission', () => {
      expect(hasAnyPermission('viewer', ['billing:write', 'project:read'])).toBe(true);
      expect(hasAnyPermission('developer', ['project:delete', 'trace:replay'])).toBe(true);
    });

    it('should return false when role has none of the listed permissions', () => {
      expect(hasAnyPermission('viewer', ['billing:write', 'project:delete'])).toBe(false);
    });

    it('should return false for empty permissions array', () => {
      expect(hasAnyPermission('owner', [])).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for each role', () => {
      const ownerPerms = getRolePermissions('owner');
      expect(ownerPerms).toContain('billing:write');
      expect(ownerPerms).toContain('project:delete');
      
      const viewerPerms = getRolePermissions('viewer');
      expect(viewerPerms).toContain('project:read');
      expect(viewerPerms).not.toContain('project:write');
    });

    it('should return a copy, not the original array', () => {
      const perms = getRolePermissions('owner');
      perms.push('fake:permission' as Permission);
      expect(ROLE_PERMISSIONS['owner']).not.toContain('fake:permission');
    });
  });

  describe('canManageRole', () => {
    it('should allow owner to manage all roles', () => {
      expect(canManageRole('owner', 'admin')).toBe(true);
      expect(canManageRole('owner', 'developer')).toBe(true);
      expect(canManageRole('owner', 'viewer')).toBe(true);
    });

    it('should allow admin to manage developer and viewer', () => {
      expect(canManageRole('admin', 'developer')).toBe(true);
      expect(canManageRole('admin', 'viewer')).toBe(true);
    });

    it('should not allow admin to manage owner or other admins', () => {
      expect(canManageRole('admin', 'owner')).toBe(false);
      expect(canManageRole('admin', 'admin')).toBe(false);
    });

    it('should allow developer to manage only viewer', () => {
      expect(canManageRole('developer', 'viewer')).toBe(true);
      expect(canManageRole('developer', 'developer')).toBe(false);
      expect(canManageRole('developer', 'admin')).toBe(false);
    });

    it('should not allow viewer to manage anyone', () => {
      expect(canManageRole('viewer', 'viewer')).toBe(false);
      expect(canManageRole('viewer', 'developer')).toBe(false);
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return proper display names', () => {
      expect(getRoleDisplayName('owner')).toBe('Owner');
      expect(getRoleDisplayName('admin')).toBe('Admin');
      expect(getRoleDisplayName('developer')).toBe('Developer');
      expect(getRoleDisplayName('viewer')).toBe('Viewer');
    });
  });

  describe('getRoleDescription', () => {
    it('should return descriptions for all roles', () => {
      expect(getRoleDescription('owner')).toContain('Full access');
      expect(getRoleDescription('admin')).toContain('manage team');
      expect(getRoleDescription('developer')).toContain('replay traces');
      expect(getRoleDescription('viewer')).toContain('Read-only');
    });
  });
});

// ============================================================================
// Shareable Link Tests
// ============================================================================

describe('Shareable Trace Links', () => {
  describe('generateShareToken', () => {
    it('should generate unique tokens', () => {
      const token1 = generateShareToken();
      const token2 = generateShareToken();
      expect(token1).not.toBe(token2);
    });

    it('should start with share_ prefix', () => {
      const token = generateShareToken();
      expect(token.startsWith('share_')).toBe(true);
    });

    it('should be at least 30 characters', () => {
      const token = generateShareToken();
      expect(token.length).toBeGreaterThanOrEqual(30);
    });
  });

  describe('generateInviteToken', () => {
    it('should generate unique tokens', () => {
      const token1 = generateInviteToken();
      const token2 = generateInviteToken();
      expect(token1).not.toBe(token2);
    });

    it('should start with invite_ prefix', () => {
      const token = generateInviteToken();
      expect(token.startsWith('invite_')).toBe(true);
    });
  });

  describe('createShareableLink', () => {
    it('should create a link with default options', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789');
      
      expect(link.runId).toBe('run_123');
      expect(link.projectId).toBe('proj_456');
      expect(link.createdBy).toBe('user_789');
      expect(link.accessLevel).toBe('view');
      expect(link.isActive).toBe(true);
      expect(link.viewCount).toBe(0);
      expect(link.expiresAt).toBeUndefined();
      expect(link.token.startsWith('share_')).toBe(true);
    });

    it('should create a link with custom options', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789', {
        accessLevel: 'comment',
        expiresInHours: 24,
        password: 'secret123',
        message: 'Check this out!',
        allowedDomains: ['company.com'],
      });

      expect(link.accessLevel).toBe('comment');
      expect(link.expiresAt).toBeDefined();
      expect(link.password).toBe('secret123');
      expect(link.message).toBe('Check this out!');
      expect(link.allowedDomains).toEqual(['company.com']);
    });

    it('should calculate expiry correctly', () => {
      const before = Date.now();
      const link = createShareableLink('run_123', 'proj_456', 'user_789', {
        expiresInHours: 24,
      });
      const after = Date.now();

      const expiryTime = new Date(link.expiresAt!).getTime();
      const expectedMin = before + 24 * 60 * 60 * 1000;
      const expectedMax = after + 24 * 60 * 60 * 1000;

      expect(expiryTime).toBeGreaterThanOrEqual(expectedMin);
      expect(expiryTime).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('isShareLinkValid', () => {
    it('should return true for active non-expired link', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789', {
        expiresInHours: 24,
      });
      expect(isShareLinkValid(link)).toBe(true);
    });

    it('should return true for active link without expiry', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789');
      expect(isShareLinkValid(link)).toBe(true);
    });

    it('should return false for inactive link', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789');
      link.isActive = false;
      expect(isShareLinkValid(link)).toBe(false);
    });

    it('should return false for expired link', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789');
      link.expiresAt = new Date(Date.now() - 1000).toISOString(); // 1 second ago
      expect(isShareLinkValid(link)).toBe(false);
    });
  });

  describe('isDomainAllowed', () => {
    it('should return true when no domain restrictions', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789');
      expect(isDomainAllowed(link, 'user@example.com')).toBe(true);
    });

    it('should return true when email matches allowed domain', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789', {
        allowedDomains: ['company.com', 'example.org'],
      });
      expect(isDomainAllowed(link, 'user@company.com')).toBe(true);
      expect(isDomainAllowed(link, 'admin@example.org')).toBe(true);
    });

    it('should return false when email does not match allowed domain', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789', {
        allowedDomains: ['company.com'],
      });
      expect(isDomainAllowed(link, 'user@other.com')).toBe(false);
    });

    it('should be case insensitive', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789', {
        allowedDomains: ['Company.COM'],
      });
      expect(isDomainAllowed(link, 'user@company.com')).toBe(true);
    });
  });

  describe('getShareUrl', () => {
    it('should generate correct URL', () => {
      const link = createShareableLink('run_123', 'proj_456', 'user_789');
      const url = getShareUrl(link, 'https://watchllm.com');
      expect(url).toBe(`https://watchllm.com/shared/${link.token}`);
    });
  });
});

// ============================================================================
// Comment System Tests
// ============================================================================

describe('Comment System', () => {
  describe('createComment', () => {
    it('should create a basic comment', () => {
      const author = { id: 'user_123', name: 'John Doe', email: 'john@example.com' };
      const comment = createComment('run_456', 'proj_789', author, 'This looks good!');

      expect(comment.runId).toBe('run_456');
      expect(comment.projectId).toBe('proj_789');
      expect(comment.authorId).toBe('user_123');
      expect(comment.authorName).toBe('John Doe');
      expect(comment.content).toBe('This looks good!');
      expect(comment.isEdited).toBe(false);
      expect(comment.isResolved).toBe(false);
      expect(comment.reactions).toEqual({});
      expect(comment.id.startsWith('comment_')).toBe(true);
    });

    it('should create a comment on a specific step', () => {
      const author = { id: 'user_123', name: 'John Doe', email: 'john@example.com' };
      const comment = createComment('run_456', 'proj_789', author, 'Step 2 issue', {
        stepIndex: 2,
      });

      expect(comment.stepIndex).toBe(2);
    });

    it('should create a reply comment', () => {
      const author = { id: 'user_123', name: 'John Doe', email: 'john@example.com' };
      const comment = createComment('run_456', 'proj_789', author, 'I agree!', {
        parentId: 'comment_parent_123',
      });

      expect(comment.parentId).toBe('comment_parent_123');
    });

    it('should extract mentions from content', () => {
      const author = { id: 'user_123', name: 'John Doe', email: 'john@example.com' };
      const comment = createComment(
        'run_456',
        'proj_789',
        author,
        'Hey @[Jane](user_456) and @[Bob](user_789), please review'
      );

      expect(comment.mentions).toEqual(['user_456', 'user_789']);
    });
  });

  describe('extractMentions', () => {
    it('should extract user IDs from mentions', () => {
      const content = 'Hello @[John](user_123) and @[Jane](user_456)!';
      const mentions = extractMentions(content);
      expect(mentions).toEqual(['user_123', 'user_456']);
    });

    it('should return empty array when no mentions', () => {
      const content = 'Just a regular comment';
      const mentions = extractMentions(content);
      expect(mentions).toEqual([]);
    });
  });

  describe('formatCommentContent', () => {
    it('should format mentions with user info', () => {
      const content = 'Hey @[John](user_123), check this out';
      const userMap = new Map([
        ['user_123', { name: 'John Doe', email: 'john@example.com' }],
      ]);
      
      const formatted = formatCommentContent(content, userMap);
      expect(formatted).toContain('data-user-id="user_123"');
      expect(formatted).toContain('@John Doe');
    });
  });

  describe('getThreadSummary', () => {
    it('should calculate thread summary correctly', () => {
      const author = { id: 'user_1', name: 'User 1', email: 'u1@test.com' };
      const comments = [
        createComment('run_1', 'proj_1', author, 'Comment 1'),
        createComment('run_1', 'proj_1', { ...author, id: 'user_2' }, 'Comment 2'),
        createComment('run_1', 'proj_1', author, 'Reply', { parentId: 'parent_1' }),
      ];
      comments[0].isResolved = true;

      const summary = getThreadSummary(comments);
      expect(summary.total).toBe(2); // Only top-level
      expect(summary.resolved).toBe(1);
      expect(summary.unresolved).toBe(1);
      expect(summary.participants).toContain('user_1');
      expect(summary.participants).toContain('user_2');
    });
  });
});

// ============================================================================
// Slack Integration Tests
// ============================================================================

describe('Slack Integration', () => {
  describe('shouldNotifySlack', () => {
    const baseConfig: SlackWebhookConfig = {
      webhookUrl: 'https://hooks.slack.com/test',
      enabled: true,
      events: ['run_failed', 'high_cost_alert'],
      minSeverity: 'warning',
      digestMode: false,
    };

    it('should return false when disabled', () => {
      const config = { ...baseConfig, enabled: false };
      expect(shouldNotifySlack(config, 'run_failed', 'error')).toBe(false);
    });

    it('should return false when event not in config', () => {
      expect(shouldNotifySlack(baseConfig, 'new_comment', 'info')).toBe(false);
    });

    it('should return false when severity below minimum', () => {
      expect(shouldNotifySlack(baseConfig, 'run_failed', 'info')).toBe(false);
    });

    it('should return true when conditions met', () => {
      expect(shouldNotifySlack(baseConfig, 'run_failed', 'error')).toBe(true);
      expect(shouldNotifySlack(baseConfig, 'high_cost_alert', 'warning')).toBe(true);
    });
  });

  describe('createRunFailedSlackMessage', () => {
    it('should create a properly formatted message', () => {
      const message = createRunFailedSlackMessage(
        'run_123',
        'MyAgent',
        'Connection timeout',
        'https://watchllm.com'
      );

      expect(message.blocks).toBeDefined();
      expect(message.blocks!.length).toBeGreaterThan(0);
      expect(message.blocks![0].type).toBe('header');
      
      const headerText = message.blocks![0].text?.text || '';
      expect(headerText).toContain('Failed');
    });
  });

  describe('createHighCostAlertSlackMessage', () => {
    it('should create message with cost details', () => {
      const message = createHighCostAlertSlackMessage(
        'MyProject',
        150.00,
        100.00,
        'daily',
        'https://watchllm.com'
      );

      expect(message.blocks).toBeDefined();
      expect(message.attachments).toBeDefined();
      expect(message.attachments![0].color).toBe('#dc2626'); // Red
    });
  });

  describe('createErrorRateSpikeSlackMessage', () => {
    it('should create message with error rate details', () => {
      const message = createErrorRateSpikeSlackMessage(
        'MyProject',
        15.5,
        2.0,
        'last hour',
        'https://watchllm.com'
      );

      expect(message.blocks).toBeDefined();
      expect(message.attachments![0].color).toBe('#f59e0b'); // Amber
    });
  });

  describe('createNewCommentSlackMessage', () => {
    it('should create message with comment content', () => {
      const comment: TraceComment = {
        id: 'comment_123',
        runId: 'run_456',
        projectId: 'proj_789',
        authorId: 'user_1',
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        content: 'This step seems to have an issue',
        createdAt: new Date().toISOString(),
        isEdited: false,
        reactions: {},
        mentions: [],
        isResolved: false,
      };

      const message = createNewCommentSlackMessage(
        comment,
        'MyAgent Run',
        'https://watchllm.com'
      );

      expect(message.blocks).toBeDefined();
      const sectionText = message.blocks![0].text?.text || '';
      expect(sectionText).toContain('John Doe');
    });
  });

  describe('createDailyDigestSlackMessage', () => {
    it('should create digest with stats', () => {
      const message = createDailyDigestSlackMessage(
        'MyProject',
        {
          totalRuns: 1000,
          successfulRuns: 950,
          failedRuns: 50,
          totalCost: 125.50,
          cacheSavings: 45.25,
          topAgents: [
            { name: 'Agent1', runs: 500, cost: 50.00 },
            { name: 'Agent2', runs: 300, cost: 35.00 },
          ],
        },
        'https://watchllm.com'
      );

      expect(message.blocks).toBeDefined();
      expect(message.blocks!.length).toBeGreaterThan(3);
    });
  });
});

// ============================================================================
// Store Tests
// ============================================================================

describe('TeamMemberStore', () => {
  let store: TeamMemberStore;

  beforeEach(() => {
    store = new TeamMemberStore();
  });

  const createMember = (overrides: Partial<TeamMember> = {}): TeamMember => ({
    id: `member_${Date.now()}_${Math.random()}`,
    userId: 'user_123',
    email: 'test@example.com',
    role: 'developer',
    projectId: 'proj_456',
    invitedAt: new Date().toISOString(),
    status: 'active',
    ...overrides,
  });

  it('should add and retrieve members', () => {
    const member = createMember();
    store.add(member);
    
    expect(store.get(member.id)).toEqual(member);
    expect(store.getSize()).toBe(1);
  });

  it('should get members by project', () => {
    const member1 = createMember({ id: 'm1', projectId: 'proj_1' });
    const member2 = createMember({ id: 'm2', projectId: 'proj_1' });
    const member3 = createMember({ id: 'm3', projectId: 'proj_2' });
    
    store.add(member1);
    store.add(member2);
    store.add(member3);

    const proj1Members = store.getByProject('proj_1');
    expect(proj1Members).toHaveLength(2);
    expect(proj1Members.map(m => m.id)).toContain('m1');
    expect(proj1Members.map(m => m.id)).toContain('m2');
  });

  it('should get members by user', () => {
    const member1 = createMember({ id: 'm1', userId: 'user_1' });
    const member2 = createMember({ id: 'm2', userId: 'user_1' });
    const member3 = createMember({ id: 'm3', userId: 'user_2' });
    
    store.add(member1);
    store.add(member2);
    store.add(member3);

    const user1Members = store.getByUser('user_1');
    expect(user1Members).toHaveLength(2);
  });

  it('should get member role for project', () => {
    const member = createMember({ userId: 'user_1', projectId: 'proj_1', role: 'admin' });
    store.add(member);

    expect(store.getMemberRole('proj_1', 'user_1')).toBe('admin');
    expect(store.getMemberRole('proj_1', 'user_999')).toBeNull();
  });

  it('should update member role', () => {
    const member = createMember({ role: 'developer' });
    store.add(member);

    expect(store.updateRole(member.id, 'admin')).toBe(true);
    expect(store.get(member.id)?.role).toBe('admin');
  });

  it('should remove members', () => {
    const member = createMember();
    store.add(member);
    
    expect(store.remove(member.id)).toBe(true);
    expect(store.get(member.id)).toBeUndefined();
    expect(store.getSize()).toBe(0);
  });
});

describe('ShareLinkStore', () => {
  let store: ShareLinkStore;

  beforeEach(() => {
    store = new ShareLinkStore();
  });

  it('should add and retrieve links', () => {
    const link = createShareableLink('run_1', 'proj_1', 'user_1');
    store.add(link);

    expect(store.get(link.id)).toEqual(link);
    expect(store.getSize()).toBe(1);
  });

  it('should get link by token', () => {
    const link = createShareableLink('run_1', 'proj_1', 'user_1');
    store.add(link);

    const retrieved = store.getByToken(link.token);
    expect(retrieved).toEqual(link);
  });

  it('should get links by run', () => {
    const link1 = createShareableLink('run_1', 'proj_1', 'user_1');
    const link2 = createShareableLink('run_1', 'proj_1', 'user_2');
    const link3 = createShareableLink('run_2', 'proj_1', 'user_1');

    store.add(link1);
    store.add(link2);
    store.add(link3);

    const runLinks = store.getByRun('run_1');
    expect(runLinks).toHaveLength(2);
  });

  it('should record access', () => {
    const link = createShareableLink('run_1', 'proj_1', 'user_1');
    store.add(link);

    expect(store.recordAccess(link.token)).toBe(true);
    
    const updated = store.get(link.id);
    expect(updated?.viewCount).toBe(1);
    expect(updated?.lastViewedAt).toBeDefined();
  });

  it('should deactivate links', () => {
    const link = createShareableLink('run_1', 'proj_1', 'user_1');
    store.add(link);

    expect(store.deactivate(link.id)).toBe(true);
    expect(store.get(link.id)?.isActive).toBe(false);
  });
});

describe('CommentStore', () => {
  let store: CommentStore;
  const author = { id: 'user_1', name: 'Test User', email: 'test@example.com' };

  beforeEach(() => {
    store = new CommentStore();
  });

  it('should add and retrieve comments', () => {
    const comment = createComment('run_1', 'proj_1', author, 'Test comment');
    store.add(comment);

    expect(store.get(comment.id)).toEqual(comment);
    expect(store.getSize()).toBe(1);
  });

  it('should get comments by run in chronological order', () => {
    const comment1 = createComment('run_1', 'proj_1', author, 'First');
    const comment2 = createComment('run_1', 'proj_1', author, 'Second');
    
    store.add(comment1);
    store.add(comment2);

    const comments = store.getByRun('run_1');
    expect(comments).toHaveLength(2);
    expect(comments[0].content).toBe('First');
  });

  it('should get comments by step', () => {
    const comment1 = createComment('run_1', 'proj_1', author, 'On step 1', { stepIndex: 1 });
    const comment2 = createComment('run_1', 'proj_1', author, 'On step 2', { stepIndex: 2 });
    const comment3 = createComment('run_1', 'proj_1', author, 'General');

    store.add(comment1);
    store.add(comment2);
    store.add(comment3);

    const step1Comments = store.getByStep('run_1', 1);
    expect(step1Comments).toHaveLength(1);
    expect(step1Comments[0].content).toBe('On step 1');
  });

  it('should update comment content', () => {
    const comment = createComment('run_1', 'proj_1', author, 'Original');
    store.add(comment);

    expect(store.update(comment.id, 'Updated')).toBe(true);
    
    const updated = store.get(comment.id);
    expect(updated?.content).toBe('Updated');
    expect(updated?.isEdited).toBe(true);
    expect(updated?.editedAt).toBeDefined();
  });

  it('should add and remove reactions', () => {
    const comment = createComment('run_1', 'proj_1', author, 'Test');
    store.add(comment);

    expect(store.addReaction(comment.id, '👍')).toBe(true);
    expect(store.addReaction(comment.id, '👍')).toBe(true);
    expect(store.get(comment.id)?.reactions['👍']).toBe(2);

    expect(store.removeReaction(comment.id, '👍')).toBe(true);
    expect(store.get(comment.id)?.reactions['👍']).toBe(1);
  });

  it('should resolve and unresolve comments', () => {
    const comment = createComment('run_1', 'proj_1', author, 'Issue');
    store.add(comment);

    expect(store.resolve(comment.id, 'resolver_1')).toBe(true);
    
    let updated = store.get(comment.id);
    expect(updated?.isResolved).toBe(true);
    expect(updated?.resolvedBy).toBe('resolver_1');
    expect(updated?.resolvedAt).toBeDefined();

    expect(store.unresolve(comment.id)).toBe(true);
    
    updated = store.get(comment.id);
    expect(updated?.isResolved).toBe(false);
    expect(updated?.resolvedBy).toBeUndefined();
  });

  it('should delete comments', () => {
    const comment = createComment('run_1', 'proj_1', author, 'To delete');
    store.add(comment);

    expect(store.delete(comment.id)).toBe(true);
    expect(store.get(comment.id)).toBeUndefined();
    expect(store.getByRun('run_1')).toHaveLength(0);
  });
});

// ============================================================================
// Defaults Tests
// ============================================================================

describe('Default Configurations', () => {
  it('should have sensible workspace defaults', () => {
    expect(DEFAULT_WORKSPACE_SETTINGS.allowPublicTraceLinks).toBe(false);
    expect(DEFAULT_WORKSPACE_SETTINGS.defaultShareExpiry).toBe(24);
    expect(DEFAULT_WORKSPACE_SETTINGS.emailNotifications).toBe(true);
  });

  it('should have sensible Slack defaults', () => {
    expect(DEFAULT_SLACK_CONFIG.enabled).toBe(false);
    expect(DEFAULT_SLACK_CONFIG.events).toContain('run_failed');
    expect(DEFAULT_SLACK_CONFIG.minSeverity).toBe('warning');
    expect(DEFAULT_SLACK_CONFIG.digestMode).toBe(false);
  });
});
