// Message template utilities for encouraging, context-aware notifications

import { Issue, NotificationMessage, PreferredTone } from '../types';

interface MessageTemplate {
  encouraging: string[];
  casual: string[];
  professional: string[];
}

const STALE_REMINDER_TEMPLATES: MessageTemplate = {
  encouraging: [
    "Hey there! {issueKey} has been waiting patiently for an update. When you have a moment, it would appreciate some attention! ✨",
    "Quick friendly reminder: {issueKey} might benefit from a status check. No rush - just keeping you in the loop! 🌟",
    "Your expertise is needed! {issueKey} has been sitting quietly and could use your insights when you're ready.",
    "Just a gentle nudge: {issueKey} would love to hear from you when you have a chance! 💫"
  ],
  casual: [
    "Hey! {issueKey} is getting a bit dusty - might be worth a quick look when you're free 👀",
    "{issueKey} has been chilling for a while. Wanna give it some love?",
    "Psst... {issueKey} is still waiting for some action. No pressure though! 😊",
    "Time for a check-in? {issueKey} could use some attention when you get a sec"
  ],
  professional: [
    "Please note: {issueKey} requires an update to maintain project momentum.",
    "{issueKey} has not been updated recently and may need attention.",
    "Status update requested: {issueKey} is awaiting review or progress update.",
    "Attention needed: {issueKey} has exceeded the standard update interval."
  ]
};

const DEADLINE_WARNING_TEMPLATES: MessageTemplate = {
  encouraging: [
    "Heads up! {issueKey} is due {timeframe}, but we have confidence you'll handle it perfectly! 💪",
    "Gentle reminder: {issueKey} is approaching its deadline in {timeframe}. You've got this! 🚀",
    "Just a friendly FYI: {issueKey} would love to be completed by {deadline}. Take your time and do your best work!",
    "Deadline approaching with grace: {issueKey} is due {timeframe}. We believe in your expertise! ⭐"
  ],
  casual: [
    "Yo! {issueKey} is due {timeframe} - just a heads up! 📅",
    "{issueKey} has a deadline coming up {timeframe}. You probably already know, but just in case! 😄",
    "Clock's ticking (gently) on {issueKey} - due {timeframe}",
    "Don't forget: {issueKey} wants to be done by {deadline}! ⏰"
  ],
  professional: [
    "Deadline notification: {issueKey} is scheduled for completion {timeframe}.",
    "Please be advised: {issueKey} has an approaching deadline of {deadline}.",
    "Time-sensitive: {issueKey} requires completion within {timeframe}.",
    "Deadline reminder: {issueKey} is due for delivery on {deadline}."
  ]
};

const PROGRESS_UPDATE_TEMPLATES: MessageTemplate = {
  encouraging: [
    "Amazing work! You've been consistently updating your tickets. {issueKey} is the only one feeling a bit lonely.",
    "You're doing fantastic! Just a couple of tickets could use your signature touch: {issueList}",
    "Great momentum this week! These tickets are ready for your expertise whenever you're available: {issueList}",
    "Outstanding progress! Just a few items waiting for your magic touch: {issueList} ✨"
  ],
  casual: [
    "You're on fire! 🔥 Just {issueKey} left behind in the dust",
    "Nice work! Got a couple stragglers that could use some love: {issueList}",
    "Looking good! These few tickets are probably feeling left out: {issueList}",
    "Solid progress! Time to show {issueList} some attention? 😊"
  ],
  professional: [
    "Progress update: Excellent work maintaining ticket velocity. {issueKey} requires attention.",
    "Status report: Strong project momentum observed. Outstanding items: {issueList}",
    "Performance noted: Consistent updates maintained. Please review: {issueList}",
    "Update summary: Project progress is on track. Action needed on: {issueList}"
  ]
};

const TEAM_ENCOURAGEMENT_TEMPLATES: MessageTemplate = {
  encouraging: [
    "The team is doing amazing work! Here are some tickets that might need a quick review: {issueList}",
    "Fantastic team collaboration this week! A few items could benefit from attention: {issueList}",
    "Team excellence in action! These tickets are ready for the next phase: {issueList} 🎯",
    "Incredible team synergy! Just a gentle reminder about these opportunities: {issueList}"
  ],
  casual: [
    "Team's looking good! 👥 Few tickets need some TLC: {issueList}",
    "Squad goals! 💯 Got some tickets that could use the team touch: {issueList}",
    "Team work makes the dream work! These need some collective love: {issueList}",
    "All hands on deck! 🚢 These tickets are calling for the team: {issueList}"
  ],
  professional: [
    "Team coordination update: The following items require collaborative attention: {issueList}",
    "Project team status: Excellent progress noted. Outstanding items: {issueList}",
    "Team performance report: Strong collaboration observed. Action items: {issueList}",
    "Coordination required: Team review needed for the following tickets: {issueList}"
  ]
};

export const generateStaleReminderMessage = (
  issue: Issue, 
  tone: PreferredTone,
  daysSinceUpdate: number
): string => {
  const templates = STALE_REMINDER_TEMPLATES[tone];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return template
    .replace('{issueKey}', `[${issue.key}] ${issue.summary}`)
    .replace('{daysSinceUpdate}', daysSinceUpdate.toString());
};

export const generateDeadlineWarningMessage = (
  issue: Issue,
  tone: PreferredTone,
  daysUntilDeadline: number
): string => {
  const templates = DEADLINE_WARNING_TEMPLATES[tone];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const timeframe = daysUntilDeadline === 1 ? 'tomorrow' : 
                   daysUntilDeadline === 0 ? 'today' :
                   `in ${daysUntilDeadline} days`;
  
  const deadline = issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'soon';
  
  return template
    .replace('{issueKey}', `[${issue.key}] ${issue.summary}`)
    .replace('{timeframe}', timeframe)
    .replace('{deadline}', deadline);
};

export const generateProgressUpdateMessage = (
  issues: Issue[],
  tone: PreferredTone
): string => {
  const templates = PROGRESS_UPDATE_TEMPLATES[tone];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  if (issues.length === 1) {
    return template.replace('{issueKey}', `[${issues[0].key}] ${issues[0].summary}`);
  }
  
  const issueList = issues
    .slice(0, 3) // Limit to first 3 to avoid overwhelming
    .map(issue => `[${issue.key}]`)
    .join(', ');
  
  return template.replace('{issueList}', issueList);
};

export const generateTeamEncouragementMessage = (
  issues: Issue[],
  tone: PreferredTone
): string => {
  const templates = TEAM_ENCOURAGEMENT_TEMPLATES[tone];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const issueList = issues
    .slice(0, 5) // Team messages can include a few more items
    .map(issue => `[${issue.key}]`)
    .join(', ');
  
  return template.replace('{issueList}', issueList);
};

export const createNotificationMessage = (
  type: 'stale-reminder' | 'deadline-warning' | 'progress-update' | 'team-encouragement',
  issue: Issue | undefined,
  issues: Issue[] | undefined,
  tone: PreferredTone,
  additionalData?: { daysSinceUpdate?: number; daysUntilDeadline?: number }
): NotificationMessage => {
  let message = '';
  let title = '';
  let priority: 'low' | 'medium' | 'high' = 'medium';

  switch (type) {
    case 'stale-reminder':
      if (issue && additionalData?.daysSinceUpdate) {
        message = generateStaleReminderMessage(issue, tone, additionalData.daysSinceUpdate);
        title = 'Gentle Reminder';
        priority = additionalData.daysSinceUpdate > 7 ? 'medium' : 'low';
      }
      break;
      
    case 'deadline-warning':
      if (issue && additionalData?.daysUntilDeadline !== undefined) {
        message = generateDeadlineWarningMessage(issue, tone, additionalData.daysUntilDeadline);
        title = 'Upcoming Deadline';
        priority = additionalData.daysUntilDeadline <= 1 ? 'high' : 'medium';
      }
      break;
      
    case 'progress-update':
      if (issues && issues.length > 0) {
        message = generateProgressUpdateMessage(issues, tone);
        title = 'Progress Update';
        priority = 'low';
      }
      break;
      
    case 'team-encouragement':
      if (issues && issues.length > 0) {
        message = generateTeamEncouragementMessage(issues, tone);
        title = 'Team Encouragement';
        priority = 'low';
      }
      break;
  }

  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    issue,
    issues,
    priority,
    timestamp: new Date(),
    dismissible: true
  };
};