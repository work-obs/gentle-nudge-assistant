import React, { useState, useCallback } from 'react';
import {
  Form,
  FormSection,
  FormHeader,
  Label,
  Select,
  TextField,
  Toggle,
  Button,
  ButtonGroup,
  LoadingButton,
  Banner,
  Textfield,
  Range,
  Checkbox,
  CheckboxGroup
} from '@forge/ui-kit';
import { SettingsPanelProps, NotificationFrequency, PreferredTone } from '../types';

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  preferences,
  onPreferencesUpdate,
  loading = false,
  error
}) => {
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleLocalUpdate = useCallback((updates: Partial<typeof preferences>) => {
    setLocalPreferences(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      await onPreferencesUpdate(localPreferences);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  }, [localPreferences, onPreferencesUpdate]);

  const handleReset = useCallback(() => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  }, [preferences]);

  const notificationFrequencyOptions = [
    { label: 'Gentle (Fewer notifications, longer intervals)', value: 'gentle' },
    { label: 'Moderate (Balanced approach)', value: 'moderate' },
    { label: 'Minimal (Only urgent reminders)', value: 'minimal' }
  ];

  const toneOptions = [
    { label: 'Encouraging (Supportive and uplifting)', value: 'encouraging' },
    { label: 'Casual (Friendly and relaxed)', value: 'casual' },
    { label: 'Professional (Direct and formal)', value: 'professional' }
  ];

  const notificationTypeOptions = [
    { label: 'Stale ticket reminders', value: 'stale-reminder' },
    { label: 'Deadline warnings', value: 'deadline-warning' },
    { label: 'Progress updates', value: 'progress-update' },
    { label: 'Team encouragement', value: 'team-encouragement' }
  ];

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading your preferences...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <FormHeader title="Gentle Nudge Assistant Settings" />
      
      {error && (
        <Banner appearance="error" style={{ marginBottom: '16px' }}>
          {error}
        </Banner>
      )}

      <Form>
        <FormSection>
          <Label htmlFor="notification-frequency">Notification Frequency</Label>
          <Select
            id="notification-frequency"
            options={notificationFrequencyOptions}
            value={localPreferences.notificationFrequency}
            onChange={(value: NotificationFrequency) => 
              handleLocalUpdate({ notificationFrequency: value })
            }
          />
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
            Choose how often you'd like to receive gentle reminders
          </div>
        </FormSection>

        <FormSection>
          <Label htmlFor="preferred-tone">Message Tone</Label>
          <Select
            id="preferred-tone"
            options={toneOptions}
            value={localPreferences.preferredTone}
            onChange={(value: PreferredTone) => 
              handleLocalUpdate({ preferredTone: value })
            }
          />
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
            Select the communication style that resonates with you
          </div>
        </FormSection>

        <FormSection>
          <Label htmlFor="stale-threshold">Stale Ticket Threshold</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Range
              id="stale-threshold"
              min={1}
              max={14}
              step={1}
              value={localPreferences.staleDaysThreshold}
              onChange={(value: number) => 
                handleLocalUpdate({ staleDaysThreshold: value })
              }
            />
            <div style={{ minWidth: '80px', fontSize: '14px' }}>
              {localPreferences.staleDaysThreshold} {localPreferences.staleDaysThreshold === 1 ? 'day' : 'days'}
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
            How many days without updates before a ticket is considered stale
          </div>
        </FormSection>

        <FormSection>
          <Label htmlFor="deadline-warning">Deadline Warning Days</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Range
              id="deadline-warning"
              min={1}
              max={7}
              step={1}
              value={localPreferences.deadlineWarningDays}
              onChange={(value: number) => 
                handleLocalUpdate({ deadlineWarningDays: value })
              }
            />
            <div style={{ minWidth: '80px', fontSize: '14px' }}>
              {localPreferences.deadlineWarningDays} {localPreferences.deadlineWarningDays === 1 ? 'day' : 'days'}
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
            How many days before a deadline to start showing reminders
          </div>
        </FormSection>

        <FormSection>
          <Label>Quiet Hours</Label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Label htmlFor="quiet-start">Start Time</Label>
              <Textfield
                id="quiet-start"
                type="time"
                value={localPreferences.quietHours.start}
                onChange={(value: string) => 
                  handleLocalUpdate({ 
                    quietHours: { 
                      ...localPreferences.quietHours, 
                      start: value 
                    }
                  })
                }
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label htmlFor="quiet-end">End Time</Label>
              <Textfield
                id="quiet-end"
                type="time"
                value={localPreferences.quietHours.end}
                onChange={(value: string) => 
                  handleLocalUpdate({ 
                    quietHours: { 
                      ...localPreferences.quietHours, 
                      end: value 
                    }
                  })
                }
              />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
            No notifications will be sent during these hours
          </div>
        </FormSection>

        <FormSection>
          <Label>Notification Types</Label>
          <CheckboxGroup
            options={notificationTypeOptions.map(option => ({
              ...option,
              isChecked: localPreferences.enabledNotificationTypes.includes(option.value)
            }))}
            onChange={(selectedValues: string[]) => 
              handleLocalUpdate({ enabledNotificationTypes: selectedValues })
            }
          />
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
            Choose which types of gentle reminders you'd like to receive
          </div>
        </FormSection>

        <FormSection>
          <ButtonGroup>
            <LoadingButton
              appearance="primary"
              isLoading={saving}
              isDisabled={!hasChanges}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </LoadingButton>
            <Button
              appearance="subtle"
              isDisabled={!hasChanges}
              onClick={handleReset}
            >
              Reset Changes
            </Button>
          </ButtonGroup>
        </FormSection>
      </Form>

      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        backgroundColor: '#F3F4F6', 
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>💡 Pro Tip</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
          The Gentle Nudge Assistant learns from your interactions. The more you engage with 
          notifications (acknowledge, dismiss, or take action), the better it becomes at 
          timing and personalizing your reminders.
        </p>
      </div>
    </div>
  );
};

export default SettingsPanel;