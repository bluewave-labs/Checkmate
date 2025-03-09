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
  Tab
} from "@mui/material";
import { useTheme } from "@emotion/react";
import TabPanel from "./TabPanel";
import TabComponent from "./TabComponent";

// Configuration for notification tabs
const NOTIFICATION_TYPES = [
  {
    id: 'slack',
    label: 'Slack',
    labelKey: 'notifications.slack.label',
    description: 'To enable Slack notifications, create a Slack app and enable incoming webhooks. After that, simply provide the webhook URL here.',
    descriptionKey: 'notifications.slack.description',
    fields: [
      {
        id: 'webhook',
        label: 'Webhook URL',
        labelKey: 'notifications.slack.webhookLabel',
        placeholder: 'https://hooks.slack.com/services/...',
        placeholderKey: 'notifications.slack.webhookPlaceholder',
        type: 'text'
      }
    ]
  },
  {
    id: 'discord',
    label: 'Discord',
    labelKey: 'notifications.discord.label',
    description: 'To send data to a Discord channel from Checkmate via Discord notifications using webhooks, you can use Discord\'s incoming Webhooks feature.',
    descriptionKey: 'notifications.discord.description',
    fields: [
      {
        id: 'webhook',
        label: 'Discord Webhook URL',
        labelKey: 'notifications.discord.webhookLabel',
        placeholder: 'https://discord.com/api/webhooks/...',
        placeholderKey: 'notifications.discord.webhookPlaceholder',
        type: 'text'
      }
    ]
  },
  {
    id: 'telegram',
    label: 'Telegram',
    labelKey: 'notifications.telegram.label',
    description: 'To enable Telegram notifications, create a Telegram bot using BotFather, an official bot for creating and managing Telegram bots. Then, get the API token and chat ID and write them down here.',
    descriptionKey: 'notifications.telegram.description',
    fields: [
      {
        id: 'token',
        label: 'Your bot token',
        labelKey: 'notifications.telegram.tokenLabel',
        placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        placeholderKey: 'notifications.telegram.tokenPlaceholder',
        type: 'text'
      },
      {
        id: 'chatId',
        label: 'Your Chat ID',
        labelKey: 'notifications.telegram.chatIdLabel',
        placeholder: '-1001234567890',
        placeholderKey: 'notifications.telegram.chatIdPlaceholder',
        type: 'text'
      }
    ]
  },
  {
    id: 'webhook',
    label: 'Webhooks',
    labelKey: 'notifications.webhook.label',
    description: 'You can set up a custom webhook to receive notifications when incidents occur.',
    descriptionKey: 'notifications.webhook.description',
    fields: [
      {
        id: 'url',
        label: 'Webhook URL',
        labelKey: 'notifications.webhook.urlLabel',
        placeholder: 'https://your-server.com/webhook',
        placeholderKey: 'notifications.webhook.urlPlaceholder',
        type: 'text'
      }
    ]
  }
];

const NotificationIntegrationModal = ({ 
  open, 
  onClose, 
  monitor,
  setMonitor,
  // Optional prop to configure available notification types
  notificationTypes = NOTIFICATION_TYPES
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  
  // Memoized function to initialize integrations state
  const initialIntegrationsState = useMemo(() => {
    const state = {};
    
    notificationTypes.forEach(type => {
      // Add enabled flag for each notification type
      state[type.id] = monitor?.notifications?.some(n => n.type === type.id) || false;
      
      // Add state for each field in the notification type
      type.fields.forEach(field => {
        const fieldKey = `${type.id}${field.id.charAt(0).toUpperCase() + field.id.slice(1)}`;
        state[fieldKey] = monitor?.notifications?.find(n => n.type === type.id)?.[field.id] || "";
      });
    });
    
    return state;
  }, [monitor, notificationTypes]); // Only recompute when these dependencies change
  
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

  const handleTestNotification = (type) => {
    console.log(`Testing ${type} notification`);
    //implement the test notification functionality
  };

  const handleSave = () => {
    //notifications array for selected integrations
    const notifications = [...(monitor?.notifications || [])];
    
    // Get all notification types IDs
    const existingTypes = notificationTypes.map(type => type.id);
    
    // Filter out notifications that are configurable in this modal
    const filteredNotifications = notifications.filter(
      notification => !existingTypes.includes(notification.type)
    );

    // Add each enabled notification with its configured fields
    notificationTypes.forEach(type => {
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
              {t('notifications.addOrEditNotifications', 'Add or edit notifications')}
            </Typography>
            
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={tabValue}
              onChange={handleChangeTab}
              aria-label="Notification tabs"
            >
              {notificationTypes.map((type) => (
                <Tab 
                  key={type.id} 
                  label={t(type.labelKey, type.label)} 
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
            {notificationTypes.map((type, index) => (
              <TabPanel key={type.id} value={tabValue} index={index}>
                <TabComponent
                  type={{
                    ...type,
                    label: t(type.labelKey, type.label),
                    description: t(type.descriptionKey, type.description),
                    fields: type.fields.map(field => ({
                      ...field,
                      label: t(field.labelKey, field.label),
                      placeholder: t(field.placeholderKey, field.placeholder)
                    }))
                  }}
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