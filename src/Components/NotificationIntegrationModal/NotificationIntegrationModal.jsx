import { useState } from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button, 
  Stack, 
  Typography, 
  Box,
  Tabs,
  Tab,
  Divider
} from "@mui/material";
import { useTheme } from "@emotion/react";
import TextInput from "../Inputs/TextInput";
import Checkbox from "../Inputs/Checkbox";

// Tab Panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NotificationIntegrationModal = ({ 
  open, 
  onClose, 
  monitor,
  setMonitor
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [integrations, setIntegrations] = useState({
    slack: monitor?.notifications?.some(n => n.type === "slack") || false,
    slackWebhook: monitor?.notifications?.find(n => n.type === "slack")?.webhook || "",
    discord: monitor?.notifications?.some(n => n.type === "discord") || false,
    discordWebhook: monitor?.notifications?.find(n => n.type === "discord")?.webhook || "",
    telegram: monitor?.notifications?.some(n => n.type === "telegram") || false,
    telegramToken: monitor?.notifications?.find(n => n.type === "telegram")?.token || "",
    telegramChatId: monitor?.notifications?.find(n => n.type === "telegram")?.chatId || "",
    webhook: monitor?.notifications?.some(n => n.type === "webhook") || false,
    webhookUrl: monitor?.notifications?.find(n => n.type === "webhook")?.url || "",
  });
  
  const testNotificationButtonStyle = {
    textDecoration: 'underline',
    color: '#344054',
    textTransform: 'none',
    padding: '0 !important',
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 'normal',
    backgroundColor: 'transparent !important',
    '&:hover': {
      backgroundColor: 'transparent !important',
      textDecoration: 'underline'
    },
    '&.Mui-disabled': {
      backgroundColor: 'transparent !important'
    },
    minWidth: '0 !important',
    boxShadow: 'none !important',
    border: 'none !important'
  };

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
    
    const existingTypes = ["slack", "discord", "telegram", "webhook"];
    const filteredNotifications = notifications.filter(
      notification => !existingTypes.includes(notification.type)
    );

    if (integrations.slack) {
      filteredNotifications.push({
        type: "slack",
        webhook: integrations.slackWebhook
      });
    }
    
    if (integrations.discord) {
      filteredNotifications.push({
        type: "discord",
        webhook: integrations.discordWebhook
      });
    }
    
    if (integrations.telegram) {
      filteredNotifications.push({
        type: "telegram",
        token: integrations.telegramToken,
        chatId: integrations.telegramChatId
      });
    }
    
    if (integrations.webhook) {
      filteredNotifications.push({
        type: "webhook",
        url: integrations.webhookUrl
      });
    }

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
          backgroundColor: theme.palette.primary.main,
          color: '#344054',
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
            pr: 20
          }}>
            <Typography variant="subtitle1" sx={{ my: 2, fontWeight: 'bold', fontSize: '0.9rem', color: '#344054'}}>
            Add or edit notifications
            </Typography>
            
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={tabValue}
              onChange={handleChangeTab}
              aria-label="Notification tabs"
              sx={{ 
                backgroundColor: theme.palette.primary.main,
                '& .MuiTab-root': { 
                  alignItems: 'flex-start',
                  px: 2,
                  fontSize: '0.9rem',
                  color: theme.palette.primary.contrastText,
                  backgroundColor: theme.palette.primary.main,
                  border: 'none',
                  borderBottom: 'none',
                  borderRight: 'none',
                  '&.Mui-selected': {
                    color: theme.palette.primary.contrastText,
                    backgroundColor: theme.palette.tertiary.main, // Match the hover background color
                    opacity: 1,
                    border: 'none',
                    borderBottom: 'none',
                    borderRight: 'none'
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.tertiary.main,
                    border: 'none'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              <Tab label="Slack" />
              <Tab label="Discord" />
              <Tab label="Telegram" />
              <Tab label="Webhooks" />
            </Tabs>
          </Box>

          {/* Right side content */}
          <Box sx={{ flex: 1, pl: 15 }}>
            {/* Slack Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 'bold' }}>Slack</Typography>
              <Typography sx={{ mt: 1, mb: 3 }}>
                To enable Slack notifications, create a Slack app and enable incoming webhooks. After that, simply provide the webhook URL here.
              </Typography>
              
              <Box sx={{ pl: 3 }}> 
              <Checkbox
                id="enable-slack"
                label="Enable Slack notifications"
                isChecked={integrations.slack}
                onChange={(e) => handleIntegrationChange('slack', e.target.checked)}
              />
            </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ mb: 4, fontWeight: 'bold' }}>Webhook URL</Typography>
                <TextInput
                  id="slack-webhook"
                  type="text"
                  placeholder="https://hooks.slack.com/services/..."
                  value={integrations.slackWebhook}
                  onChange={(e) => handleInputChange('slackWebhook', e.target.value)}
                  disabled={!integrations.slack}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="text" 
                  color="info"
                  onClick={() => handleTestNotification('slack')}
                  disabled={!integrations.slack || !integrations.slackWebhook}
                  sx={testNotificationButtonStyle}
                >
                  Test notification
                </Button>
              </Box>
            </TabPanel>

            {/* Discord Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 'bold' }}>Discord</Typography>
              <Typography sx={{ mt: 1, mb: 3 }}>
                To send data to a Discord channel from Checkmate via Discord notifications using webhooks, you can use Discord's incoming Webhooks feature.
              </Typography>
              
              <Box sx={{ pl: 3 }}>
                <Checkbox
                  id="enable-discord"
                  label="Enable Discord notifications"
                  isChecked={integrations.discord}
                  onChange={(e) => handleIntegrationChange('discord', e.target.checked)}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ mb: 4, fontWeight: 'bold' }}>Discord Webhook URL</Typography>
                <TextInput
                  id="discord-webhook"
                  type="text"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={integrations.discordWebhook}
                  onChange={(e) => handleInputChange('discordWebhook', e.target.value)}
                  disabled={!integrations.discord}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="text" 
                  color="info"
                  onClick={() => handleTestNotification('discord')}
                  disabled={!integrations.discord || !integrations.discordWebhook}
                  sx={testNotificationButtonStyle}
                >
                  Test notification
                </Button>
              </Box>
            </TabPanel>

            {/* Telegram Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 'bold' }}>Telegram</Typography>
              <Typography sx={{ mt: 1, mb: 3 }}>
                To enable Telegram notifications, create a Telegram bot using BotFather, an official bot for creating and managing Telegram bots. Then, get the API token and chat ID and write them down here.
              </Typography>
              
              <Box sx={{ pl: 3 }}>
                <Checkbox
                  id="enable-telegram"
                  label="Enable Telegram notifications"
                  isChecked={integrations.telegram}
                  onChange={(e) => handleIntegrationChange('telegram', e.target.checked)}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ mb: 4, fontWeight: 'bold' }}>Your bot token</Typography>
                <TextInput
                  id="telegram-token"
                  type="text"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  value={integrations.telegramToken}
                  onChange={(e) => handleInputChange('telegramToken', e.target.value)}
                  disabled={!integrations.telegram}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ mb: 4, fontWeight: 'bold' }}>Your Chat ID</Typography>
                <TextInput
                  id="telegram-chat-id"
                  type="text"
                  placeholder="-1001234567890"
                  value={integrations.telegramChatId}
                  onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                  disabled={!integrations.telegram}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="text" 
                  color="info"
                  onClick={() => handleTestNotification('telegram')}
                  disabled={!integrations.telegram || !integrations.telegramToken || !integrations.telegramChatId}
                  sx={testNotificationButtonStyle}
                >
                  Test notification
                </Button>
              </Box>
            </TabPanel>

            {/* Webhooks Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="subtitle1" component="h4" sx={{ fontWeight: 'bold' }}>Webhooks</Typography>
              <Typography sx={{ mt: 1, mb: 3 }}>
                You can set up a custom webhook to receive notifications when incidents occur.
              </Typography>
              
              <Box sx={{ pl: 3 }}>
                <Checkbox
                  id="enable-webhook"
                  label="Enable Webhook notifications"
                  isChecked={integrations.webhook}
                  onChange={(e) => handleIntegrationChange('webhook', e.target.checked)}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ mb: 4, fontWeight: 'bold' }}>Webhook URL</Typography>
                <TextInput
                  id="webhook-url"
                  type="text"
                  placeholder="https://your-server.com/webhook"
                  value={integrations.webhookUrl}
                  onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                  disabled={!integrations.webhook}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="text" 
                  color="info"
                  onClick={() => handleTestNotification('webhook')}
                  disabled={!integrations.webhook || !integrations.webhookUrl}
                  sx={testNotificationButtonStyle}
                >
                  Test notification
                </Button>
              </Box>
            </TabPanel>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        p: theme.spacing(4),
        display: 'flex',
        justifyContent: 'flex-end',  
        mb: theme.spacing(10),
        mr: theme.spacing(10)
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