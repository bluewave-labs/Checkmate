import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from 'react-toastify';

import { 
  Dialog, 
  DialogContent, 
  DialogActions,
  Button, 
  Typography, 
  Box,
  Tabs,
  Tab
} from "@mui/material";
import { useTheme } from "@emotion/react";
import TabPanel from "./TabPanel";
import TabComponent from "./TabComponent";

const NotificationIntegrationModal = ({ 
  open, 
  onClose, 
  monitor,
  setMonitor,
  // Optional prop to configure available notification types
  notificationTypes = null
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  
  // Define notification types
  const DEFAULT_NOTIFICATION_TYPES = [
    {
      id: 'slack',
      label: t('notifications.slack.label'),
      description: t('notifications.slack.description'),
      fields: [
        {
          id: 'webhook',
          label: t('notifications.slack.webhookLabel'),
          placeholder: t('notifications.slack.webhookPlaceholder'),
          type: 'text'
        }
      ]
    },
    {
      id: 'discord',
      label: t('notifications.discord.label'),
      description: t('notifications.discord.description'),
      fields: [
        {
          id: 'webhook',
          label: t('notifications.discord.webhookLabel'),
          placeholder: t('notifications.discord.webhookPlaceholder'),
          type: 'text'
        }
      ]
    },
    {
      id: 'telegram',
      label: t('notifications.telegram.label'),
      description: t('notifications.telegram.description'),
      fields: [
        {
          id: 'token',
          label: t('notifications.telegram.tokenLabel'),
          placeholder: t('notifications.telegram.tokenPlaceholder'),
          type: 'text'
        },
        {
          id: 'chatId',
          label: t('notifications.telegram.chatIdLabel'),
          placeholder: t('notifications.telegram.chatIdPlaceholder'),
          type: 'text'
        }
      ]
    },
    {
      id: 'webhook',
      label: t('notifications.webhook.label'),
      description: t('notifications.webhook.description'),
      fields: [
        {
          id: 'url',
          label: t('notifications.webhook.urlLabel'),
          placeholder: t('notifications.webhook.urlPlaceholder'),
          type: 'text'
        }
      ]
    }
  ];

  // Use provided notification types or default to our translated ones
  const activeNotificationTypes = notificationTypes || DEFAULT_NOTIFICATION_TYPES;
  
  // Memoized function to initialize integrations state
  const initialIntegrationsState = useMemo(() => {
    const state = {};
    
    activeNotificationTypes.forEach(type => {
      // Add enabled flag for each notification type
      state[type.id] = monitor?.notifications?.some(n => n.type === type.id) || false;
      
      // Add state for each field in the notification type
      type.fields.forEach(field => {
        const fieldKey = `${type.id}${field.id.charAt(0).toUpperCase() + field.id.slice(1)}`;
        state[fieldKey] = monitor?.notifications?.find(n => n.type === type.id)?.[field.id] || "";
      });
    });
    
    return state;
  }, [monitor, activeNotificationTypes]); // Only recompute when these dependencies change
  
  const [integrations, setIntegrations] = useState(initialIntegrationsState);

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleIntegrationChange = (type, checked) => {
    setIntegrations(prev => ({
      ...prev,
      [type]: checked
    }));
  };

  const handleInputChange = (type, value) => {
    setIntegrations(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleTestNotification = async (type) => {
    // Get the notification type details
    const notificationType = activeNotificationTypes.find(t => t.id === type);
    
    if (notificationType === undefined) {
      return;
    }
    
    // Helper to get the field state key
    const getFieldKey = (typeId, fieldId) => {
      return `${typeId}${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`;
    };
    
    // Prepare request payload based on notification type
    let payload = { platform: type };
    
    switch(type) {
      case 'slack':
        payload.webhookUrl = integrations[getFieldKey('slack', 'webhook')];
        if (!payload.webhookUrl) {
          toast.error('Please enter a Slack webhook URL first.');
          return;
        }
        break;
        
      case 'discord':
        payload.webhookUrl = integrations[getFieldKey('discord', 'webhook')];
        if (!payload.webhookUrl) {
          toast.error('Please enter a Discord webhook URL first.');
          return;
        }
        break;
        
      case 'telegram':
        payload.botToken = integrations[getFieldKey('telegram', 'token')];
        payload.chatId = integrations[getFieldKey('telegram', 'chatId')];
        if (!payload.botToken || !payload.chatId) {
          toast.error('Please enter both Telegram bot token and chat ID.');
          return;
        }
        break;
        
      case 'webhook':
        payload.webhookUrl = integrations[getFieldKey('webhook', 'url')];
        payload.platform = 'slack'; // Use slack as platform for webhooks
        if (!payload.webhookUrl) {
          toast.error('Please enter a webhook URL first.');
          return;
        }
        break;
        
      default:
        toast.error('This notification type cannot be tested.');
        return;
    }
    
    try {
        const apiUrl = `${import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000'}/api/v1/notifications/test-webhook`;

      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Test notification sent successfully!');
      } else {
        throw new Error(data.msg || 'Failed to send test notification');
      }
    } catch (error) {
      toast.error(`Failed to send test notification: ${error.message}`);
    }
  };
  
  
  const handleSave = () => {
    //notifications array for selected integrations
    const notifications = [...(monitor?.notifications || [])];
    
    // Get all notification types IDs
    const existingTypes = activeNotificationTypes.map(type => type.id);
    
    // Filter out notifications that are configurable in this modal
    const filteredNotifications = notifications.filter(
      notification => !existingTypes.includes(notification.type)
    );

    // Add each enabled notification with its configured fields
    activeNotificationTypes.forEach(type => {
      if (integrations[type.id]) {
        const notificationObject = {
          type: type.id
        };
        
        // Add each field value to the notification object
        type.fields.forEach(field => {
          const fieldKey = `${type.id}${field.id.charAt(0).toUpperCase() + field.id.slice(1)}`;
          notificationObject[field.id] = integrations[fieldKey];
        });
        
        filteredNotifications.push(notificationObject);
      }
    });

    // Update monitor with new notifications
    setMonitor(prev => ({
      ...prev,
      notifications: filteredNotifications
    }));
    
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{
        '& .MuiDialog-paper': {
          width: `calc(80% - ${theme.spacing(40)})`, 
          maxWidth: `${theme.breakpoints.values.md - 70}px` 
        }
      }}
    >
      <DialogContent>
        <Box sx={{ 
          display: 'flex', 
          height: `calc(26vh - ${theme.spacing(20)})` 
        }}>
          {/* Left sidebar with tabs */}
          <Box sx={{ 
            borderRight: 1, 
            borderColor: theme.palette.primary.lowContrast, 
            width: '30%',
            maxWidth: theme.spacing(120), 
            pr: theme.spacing(10)
          }}>
            <Typography variant="subtitle1" sx={{ 
              my: theme.spacing(1), 
              fontWeight: 'bold', 
              fontSize: theme.typography.fontSize * 0.9, 
              color: theme.palette.primary.contrastTextSecondary,
              pl: theme.spacing(4)
            }}>
              {t('notifications.addOrEditNotifications')}
            </Typography>
            
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={tabValue}
              onChange={handleChangeTab}
              aria-label="Notification tabs"
            >
              {activeNotificationTypes.map((type) => (
                <Tab 
                  key={type.id} 
                  label={type.label} 
                  orientation="vertical"
                  disableRipple
                />
              ))}
            </Tabs>
          </Box>

          {/* Right side content */}
          <Box sx={{ 
            flex: 1,
            pl: theme.spacing(7.5),
            overflowY: 'auto'
          }}>
            {activeNotificationTypes.map((type, index) => (
              <TabPanel key={type.id} value={tabValue} index={index}>
                <TabComponent
                  type={type}
                  integrations={integrations}
                  handleIntegrationChange={handleIntegrationChange}
                  handleInputChange={handleInputChange}
                  handleTestNotification={handleTestNotification}
                />
              </TabPanel>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        p: theme.spacing(4),
        display: 'flex',
        justifyContent: 'flex-end',  
        mb: theme.spacing(5),
        mr: theme.spacing(5)
      }}>
        <Button 
          variant="contained" 
          color="accent" 
          onClick={handleSave}
          sx={{ 
            width: 'auto', 
            minWidth: theme.spacing(60), 
            px: theme.spacing(8) 
          }}
        >
          {t('common.save', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationIntegrationModal;