import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { 
  Dialog, 
  DialogContent, 
  DialogActions,
  Button, 
  Typography, 
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import { useTheme } from "@emotion/react";
import TabPanel from "./TabPanel";
import TabComponent from "./TabComponent";
import useNotifications from "../Hooks/useNotification";

// Define constants for notification types to avoid magic values
const NOTIFICATION_TYPES = {
  SLACK: 'slack',
  DISCORD: 'discord',
  TELEGRAM: 'telegram',
  WEBHOOK: 'webhook'
};

// Define constants for field IDs
const FIELD_IDS = {
  WEBHOOK: 'webhook',
  TOKEN: 'token',
  CHAT_ID: 'chatId',
  URL: 'url'
};

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
  
  const [loading, _, sendTestNotification] = useNotifications();
  
  // Helper to get the field state key with error handling
  const getFieldKey = (typeId, fieldId) => {
    if (typeof typeId !== 'string' || typeId === '') {
      throw new Error(t('errorInvalidTypeId'));
    }
    
    if (typeof fieldId !== 'string' || fieldId === '') {
      throw new Error(t('errorInvalidFieldId'));
    }
    
    return `${typeId}${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`;
  };
  
  // Define notification types
  const DEFAULT_NOTIFICATION_TYPES = [
    {
      id: NOTIFICATION_TYPES.SLACK,
      label: t('notifications.slack.label'),
      description: t('notifications.slack.description'),
      fields: [
        {
          id: FIELD_IDS.WEBHOOK,
          label: t('notifications.slack.webhookLabel'),
          placeholder: t('notifications.slack.webhookPlaceholder'),
          type: 'text'
        }
      ]
    },
    {
      id: NOTIFICATION_TYPES.DISCORD,
      label: t('notifications.discord.label'),
      description: t('notifications.discord.description'),
      fields: [
        {
          id: FIELD_IDS.WEBHOOK,
          label: t('notifications.discord.webhookLabel'),
          placeholder: t('notifications.discord.webhookPlaceholder'),
          type: 'text'
        }
      ]
    },
    {
      id: NOTIFICATION_TYPES.TELEGRAM,
      label: t('notifications.telegram.label'),
      description: t('notifications.telegram.description'),
      fields: [
        {
          id: FIELD_IDS.TOKEN,
          label: t('notifications.telegram.tokenLabel'),
          placeholder: t('notifications.telegram.tokenPlaceholder'),
          type: 'text'
        },
        {
          id: FIELD_IDS.CHAT_ID,
          label: t('notifications.telegram.chatIdLabel'),
          placeholder: t('notifications.telegram.chatIdPlaceholder'),
          type: 'text'
        }
      ]
    },
    {
      id: NOTIFICATION_TYPES.WEBHOOK,
      label: t('notifications.webhook.label'),
      description: t('notifications.webhook.description'),
      fields: [
        {
          id: FIELD_IDS.URL,
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
        const fieldKey = getFieldKey(type.id, field.id);
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
    
    if (typeof notificationType === "undefined") {
      return;
    }
    
    // Prepare config object based on notification type
    const config = {};
    
    // Add each field value to the config object
    notificationType.fields.forEach(field => {
      const fieldKey = getFieldKey(type, field.id);
      config[field.id] = integrations[fieldKey];
    });
    
    await sendTestNotification(type, config);
  };
  
  // In NotificationIntegrationModal.jsx, update the handleSave function:

const handleSave = () => {
  // Get existing notifications
  const notifications = [...(monitor?.notifications || [])];
  
  // Get all notification types IDs
  const existingTypes = activeNotificationTypes.map(type => type.id);
  
  // Filter out notifications that are configurable in this modal
  const filteredNotifications = notifications.filter(
    notification => {
    
      if (notification.platform) {
        return !existingTypes.includes(notification.platform);
      }
     
      return !existingTypes.includes(notification.type);
    }
  );

  // Add each enabled notification with its configured fields
  activeNotificationTypes.forEach(type => {
    if (integrations[type.id]) {

      let notificationObject = {
        type: "webhook", 
        platform: type.id, // Set platform to identify the specific service
        config: {}
      };
      
      // Configure based on notification type
      switch(type.id) {
        case "slack":
        case "discord":
          notificationObject.config.webhookUrl = integrations[getFieldKey(type.id, 'webhook')];
          break;
        case "telegram":
          notificationObject.config.botToken = integrations[getFieldKey(type.id, 'token')];
          notificationObject.config.chatId = integrations[getFieldKey(type.id, 'chatId')];
          break;
        case "webhook":
          notificationObject.config.webhookUrl = integrations[getFieldKey(type.id, 'url')];
          break;
      }
      
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
                  isLoading={loading}
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
          loading={loading}
          sx={{ 
            width: 'auto', 
            minWidth: theme.spacing(60), 
            px: theme.spacing(8)
          }}
        >
          {t('commonSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationIntegrationModal;