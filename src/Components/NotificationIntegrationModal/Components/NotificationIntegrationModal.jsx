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
  CircularProgress
} from "@mui/material";
import { useTheme } from "@emotion/react";
import TabPanel from "./TabPanel";
import TabComponent from "./TabComponent";
import useNotifications from "../Hooks/useNotification";

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
  
  const { loading, sendTestNotification } = useNotifications();
  
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
    
    // Prepare config object based on notification type
    const config = {};
    
    // Add each field value to the config object
    notificationType.fields.forEach(field => {
      const fieldKey = getFieldKey(type, field.id);
      config[field.id] = integrations[fieldKey];
    });
    
    await sendTestNotification(type, config);
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
          disabled={loading}
          sx={{ 
            width: 'auto', 
            minWidth: theme.spacing(60), 
            px: theme.spacing(8) 
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : t('common.save', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationIntegrationModal;