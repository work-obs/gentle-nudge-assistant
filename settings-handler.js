// Forge function handler for settings management
const { SettingsHandler } = require('./dist/config');

exports.handler = async (event, context) => {
  try {
    const handler = new SettingsHandler(context);
    
    switch (event.eventType) {
      case 'get-preferences':
        return await handler.getUserPreferences(event);
      case 'save-preferences':
        return await handler.saveUserPreferences(event);
      case 'get-panel-data':
        return await handler.getPanelData(event);
      default:
        console.warn('Unknown event type:', event.eventType);
        return { statusCode: 200, body: 'Event ignored' };
    }
  } catch (error) {
    console.error('Settings handler error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};