import { useState, useEffect, useCallback } from 'react';
import { requestJira } from '@forge/bridge';
import { DashboardData, UseDashboardDataReturn, Issue } from '../types';

export const useDashboardData = (
  projectKey?: string
): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build JQL query based on project context
      let jql = 'assignee = currentUser() AND resolution = Unresolved';
      if (projectKey) {
        jql = `project = "${projectKey}" AND resolution = Unresolved`;
      }

      // Fetch issues data
      const issuesResponse = await requestJira('/rest/api/3/search', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jql,
          fields: [
            'summary',
            'status',
            'priority',
            'assignee',
            'updated',
            'duedate',
            'project',
          ],
          maxResults: 1000,
        }),
      });

      const issues: Issue[] = issuesResponse.body.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || 'None',
        assignee: issue.fields.assignee
          ? {
              displayName: issue.fields.assignee.displayName,
              accountId: issue.fields.assignee.accountId,
            }
          : undefined,
        updated: issue.fields.updated,
        dueDate: issue.fields.duedate,
        project: {
          key: issue.fields.project.key,
          name: issue.fields.project.name,
        },
      }));

      // Calculate stale issues (not updated in last 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const staleIssues = issues.filter(
        issue => new Date(issue.updated) < threeDaysAgo
      );

      // Calculate upcoming deadlines (due within 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const upcomingDeadlines = issues.filter(
        issue =>
          issue.dueDate &&
          new Date(issue.dueDate) <= sevenDaysFromNow &&
          new Date(issue.dueDate) >= new Date()
      );

      // Calculate recent updates (updated in last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentUpdates = issues.filter(
        issue => new Date(issue.updated) >= yesterday
      );

      // Group issues by assignee for team stats
      const assigneeMap = new Map<
        string,
        {
          accountId: string;
          displayName: string;
          assignedIssues: number;
          staleIssues: number;
        }
      >();

      issues.forEach(issue => {
        if (issue.assignee) {
          const existing = assigneeMap.get(issue.assignee.accountId) || {
            accountId: issue.assignee.accountId,
            displayName: issue.assignee.displayName,
            assignedIssues: 0,
            staleIssues: 0,
          };

          existing.assignedIssues += 1;
          if (staleIssues.some(stale => stale.key === issue.key)) {
            existing.staleIssues += 1;
          }

          assigneeMap.set(issue.assignee.accountId, existing);
        }
      });

      // Mock nudge stats (in real implementation, this would come from tracking data)
      const nudgeStats = {
        totalNudgesSent: Math.floor(issues.length * 0.3),
        acknowledgedNudges: Math.floor(issues.length * 0.2),
        actionedNudges: Math.floor(issues.length * 0.15),
        effectivenessRate: 0.72,
      };

      const dashboardData: DashboardData = {
        teamStats: {
          totalActiveIssues: issues.length,
          staleIssues: staleIssues.length,
          upcomingDeadlines: upcomingDeadlines.length,
          recentUpdates: recentUpdates.length,
        },
        nudgeStats,
        teamMembers: Array.from(assigneeMap.values()),
      };

      setData(dashboardData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectKey]);

  const refresh = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    refresh,
    loading,
    error,
  };
};
