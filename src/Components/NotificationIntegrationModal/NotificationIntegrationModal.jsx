import { useState } from "react";
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
    description: 'To enable Slack notifications, create a Slack app and enable incoming webhooks. After that, simply provide the webhook URL here.',
    fields: [
      {
        id: 'webhook',
        label: 'Webhook URL',
        placeholder: 'https://hooks.slack.com/services/...',
        type: 'text'
      }
    ]
  },
  {
    id: 'discord',
    label: 'Discord',
    description: 'To send data to a Discord channel from Checkmate via Discord notifications using webhooks, you can use Discord\'s incoming Webhooks feature.',
    fields: [
      {
        id: 'webhook',
        label: 'Discord Webhook URL',
        placeholder: 'https://discord.com/api/webhooks/...',
        type: 'text'
      }
    ]
  },
  {
    id: 'telegram',
    label: 'Telegram',
    description: 'To enable Telegram notifications, create a Telegram bot using BotFather, an official bot for creating and managing Telegram bots. Then, get the API token and chat ID and write them down here.',
    fields: [
      {
        id: 'token',
        label: 'Your bot token',
        placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        type: 'text'
      },
      {
        id: 'chatId',
        label: 'Your Chat ID',
        placeholder: '-1001234567890',
        type: 'text'
      }
    ]
  },
  {
    id: 'webhook',
    label: 'Webhooks',
    description: 'You can set up a custom webhook to receive notifications when incidents occur.',
    fields: [
      {
        id: 'url',
        label: 'Webhook URL',
        placeholder: 'https://your-server.com/webhook',
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
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  
  // Initialize integrations state based on available notification types
  const initializeIntegrationsState = () => {
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
  };
  
  const [integrations, setIntegrations] = useState(initializeIntegrationsState());

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
          maxWidth: '775px'
        }
      }}
    >
      <DialogContent>
        <Box sx={{ display: 'flex', height: '300px' }}>
          {/* Left sidebar with tabs */}
          <Box sx={{ 
            borderRight: 1, 
            borderColor: 'divider', 
            minWidth: '200px',
            pr: theme.spacing(10)
          }}>
            <Typography variant="subtitle1" sx={{ 
              my: theme.spacing(1), 
              fontWeight: 'bold', 
              fontSize: '0.9rem', 
              color: theme.palette.primary.contrastTextSecondary 
            }}>
              Add or edit notifications
            </Typography>
            
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={tabValue}
              onChange={handleChangeTab}
              aria-label="Notification tabs"
            >
              {notificationTypes.map((type) => (
                <Tab key={type.id} label={type.label} orientation="vertical" />
              ))}
            </Tabs>
          </Box>

          {/* Right side content */}
          <Box sx={{ flex: 1, pl: theme.spacing(7.5) }}>
            {notificationTypes.map((type, index) => (
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
            width: '120px'
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationIntegrationModal;