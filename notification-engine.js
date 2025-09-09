// Forge function handler for notification engine
const { NotificationEngine } = require('./dist/notification-engine');

exports.handler = async (event, context) => {
  try {
    const engine = new NotificationEngine(context);
    
    switch (event.eventType) {
      case 'avi:jira:scheduled:issue-stale-check':
        return await engine.processStaleIssues(event);
      case 'webhook':
        return await engine.handleWebhook(event);
      default:
        console.warn('Unknown event type:', event.eventType);
        return { statusCode: 200, body: 'Event ignored' };
    }
  } catch (error) {
    console.error('Notification engine error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};