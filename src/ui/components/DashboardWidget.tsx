import React, { useEffect, useState } from 'react';
import { Button, LoadingButton, Banner, ProgressBar } from '@forge/ui-kit';
import { DashboardWidgetProps } from '../types';
import { staggerContainer, staggerItem } from '../utils/animations';

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  data,
  loading = false,
  error,
  refreshInterval = 300000, // 5 minutes
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh functionality
  useEffect(() => {
    if (!refreshInterval || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to refresh dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={widgetContainerStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Gentle Nudge Dashboard</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={loadingSpinnerStyle}></div>
          <p style={{ marginTop: '16px', color: '#6B7280' }}>
            Loading your team's progress...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={widgetContainerStyle}>
        <Banner appearance="error">
          {error}
          {onRefresh && (
            <Button appearance="link" onClick={handleRefresh}>
              Try again
            </Button>
          )}
        </Banner>
      </div>
    );
  }

  if (!data) return null;

  const effectivenessPercentage = Math.round(data.nudgeStats.effectivenessRate * 100);
  const acknowledgedPercentage = data.nudgeStats.totalNudgesSent > 0 
    ? Math.round((data.nudgeStats.acknowledgedNudges / data.nudgeStats.totalNudgesSent) * 100)
    : 0;

  return (
    <div style={widgetContainerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>
            <span style={{ marginRight: '8px' }}>🎯</span>
            Gentle Nudge Dashboard
          </h3>
          <p style={subtitleStyle}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        {onRefresh && (
          <LoadingButton
            appearance="subtle"
            isLoading={refreshing}
            onClick={handleRefresh}
            size="small"
          >
            Refresh
          </LoadingButton>
        )}
      </div>

      {/* Team Stats Grid */}
      <div style={statsGridStyle}>
        <StatCard
          icon="📊"
          title="Active Issues"
          value={data.teamStats.totalActiveIssues}
          subtitle="Total in progress"
          color="#0EA5E9"
        />
        <StatCard
          icon="⏰"
          title="Stale Issues"
          value={data.teamStats.staleIssues}
          subtitle="Need attention"
          color="#F59E0B"
          warning={data.teamStats.staleIssues > 0}
        />
        <StatCard
          icon="⚡"
          title="Upcoming Deadlines"
          value={data.teamStats.upcomingDeadlines}
          subtitle="Due soon"
          color="#EF4444"
          warning={data.teamStats.upcomingDeadlines > 3}
        />
        <StatCard
          icon="🚀"
          title="Recent Updates"
          value={data.teamStats.recentUpdates}
          subtitle="Last 24 hours"
          color="#10B981"
        />
      </div>

      {/* Nudge Effectiveness Section */}
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}>
          <span style={{ marginRight: '8px' }}>📈</span>
          Nudge Effectiveness
        </h4>
        <div style={effectivenessGridStyle}>
          <div style={effectivenessCardStyle}>
            <div style={effectivenessHeaderStyle}>
              <span style={effectivenessLabelStyle}>Overall Effectiveness</span>
              <span style={effectivenessValueStyle}>{effectivenessPercentage}%</span>
            </div>
            <ProgressBar 
              value={effectivenessPercentage} 
              max={100}
              appearance="success"
            />
            <div style={effectivenessSubtextStyle}>
              Great work! Your team responds well to gentle reminders.
            </div>
          </div>
          
          <div style={effectivenessStatsStyle}>
            <div style={statRowStyle}>
              <span>Total Nudges Sent:</span>
              <strong>{data.nudgeStats.totalNudgesSent}</strong>
            </div>
            <div style={statRowStyle}>
              <span>Acknowledged:</span>
              <strong>{data.nudgeStats.acknowledgedNudges} ({acknowledgedPercentage}%)</strong>
            </div>
            <div style={statRowStyle}>
              <span>Actions Taken:</span>
              <strong>{data.nudgeStats.actionedNudges}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      {data.teamMembers.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>
            <span style={{ marginRight: '8px' }}>👥</span>
            Team Overview
          </h4>
          <div style={teamGridStyle}>
            {data.teamMembers.map((member) => (
              <div key={member.accountId} style={teamMemberCardStyle}>
                <div style={memberHeaderStyle}>
                  <span style={memberNameStyle}>{member.displayName}</span>
                  <div style={memberBadgeStyle(member.staleIssues)}>
                    {member.staleIssues > 0 ? `${member.staleIssues} stale` : '✅ up to date'}
                  </div>
                </div>
                <div style={memberStatsStyle}>
                  <span>{member.assignedIssues} assigned</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encouraging message */}
      <div style={encouragementStyle}>
        <div style={encouragementIconStyle}>🌟</div>
        <div>
          <div style={encouragementTitleStyle}>Keep up the great work!</div>
          <div style={encouragementTextStyle}>
            {data.teamStats.staleIssues === 0 
              ? "Amazing! No stale issues detected. Your team is staying on top of everything!"
              : data.teamStats.staleIssues <= 3
              ? "You're doing great! Just a few items need attention, but overall progress is excellent."
              : "Good momentum! Let's focus on those stale issues to keep the project moving forward."
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// StatCard component
const StatCard: React.FC<{
  icon: string;
  title: string;
  value: number;
  subtitle: string;
  color: string;
  warning?: boolean;
}> = ({ icon, title, value, subtitle, color, warning }) => (
  <div style={{
    ...statCardStyle,
    borderLeft: `4px solid ${warning ? '#F59E0B' : color}`
  }}>
    <div style={statIconStyle}>{icon}</div>
    <div style={statContentStyle}>
      <div style={{
        ...statValueStyle,
        color: warning ? '#F59E0B' : color
      }}>
        {value}
      </div>
      <div style={statTitleStyle}>{title}</div>
      <div style={statSubtitleStyle}>{subtitle}</div>
    </div>
  </div>
);

// Styles
const widgetContainerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: '1px solid #E5E7EB',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  maxWidth: '100%',
  overflow: 'hidden'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '24px'
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 4px 0',
  fontSize: '24px',
  fontWeight: 700,
  color: '#111827',
  display: 'flex',
  alignItems: 'center'
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#6B7280'
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
  marginBottom: '32px'
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#F9FAFB',
  borderRadius: '8px',
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'transform 0.2s ease',
  cursor: 'default'
};

const statIconStyle: React.CSSProperties = {
  fontSize: '24px',
  width: '32px',
  textAlign: 'center'
};

const statContentStyle: React.CSSProperties = {
  flex: 1
};

const statValueStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  lineHeight: 1,
  margin: '0 0 4px 0'
};

const statTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#374151',
  margin: '0 0 2px 0'
};

const statSubtitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6B7280',
  margin: 0
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px'
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: '18px',
  fontWeight: 600,
  color: '#374151',
  display: 'flex',
  alignItems: 'center'
};

const effectivenessGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '24px',
  alignItems: 'start'
};

const effectivenessCardStyle: React.CSSProperties = {
  backgroundColor: '#F0F9FF',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #BAE6FD'
};

const effectivenessHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
};

const effectivenessLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#0369A1'
};

const effectivenessValueStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#0EA5E9'
};

const effectivenessSubtextStyle: React.CSSProperties = {
  marginTop: '8px',
  fontSize: '12px',
  color: '#0369A1'
};

const effectivenessStatsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '14px',
  color: '#374151'
};

const teamGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '12px'
};

const teamMemberCardStyle: React.CSSProperties = {
  backgroundColor: '#FAFAFA',
  borderRadius: '6px',
  padding: '12px',
  border: '1px solid #E5E7EB'
};

const memberHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px'
};

const memberNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#374151'
};

const memberBadgeStyle = (staleCount: number): React.CSSProperties => ({
  fontSize: '11px',
  padding: '2px 6px',
  borderRadius: '4px',
  fontWeight: 500,
  backgroundColor: staleCount > 0 ? '#FEF3F2' : '#F0FDF4',
  color: staleCount > 0 ? '#991B1B' : '#166534',
  border: `1px solid ${staleCount > 0 ? '#FECDCA' : '#BBF7D0'}`
});

const memberStatsStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6B7280'
};

const encouragementStyle: React.CSSProperties = {
  backgroundColor: '#F0FDF4',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #BBF7D0',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
};

const encouragementIconStyle: React.CSSProperties = {
  fontSize: '20px',
  marginTop: '2px'
};

const encouragementTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#166534',
  margin: '0 0 4px 0'
};

const encouragementTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#166534',
  lineHeight: 1.5,
  margin: 0
};

const loadingSpinnerStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  border: '3px solid #E5E7EB',
  borderTop: '3px solid #3B82F6',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto'
};

export default DashboardWidget;