// Forge function handler for analytics processor
const { AnalyticsProcessor } = require('./dist/analytics');

exports.handler = async (event, context) => {
  try {
    const processor = new AnalyticsProcessor(context);
    
    switch (event.eventType) {
      case 'avi:jira:scheduled:deadline-check':
        return await processor.processDeadlines(event);
      case 'dashboard-data':
        return await processor.getDashboardData(event);
      default:
        console.warn('Unknown event type:', event.eventType);
        return { statusCode: 200, body: 'Event ignored' };
    }
  } catch (error) {
    console.error('Analytics processor error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};