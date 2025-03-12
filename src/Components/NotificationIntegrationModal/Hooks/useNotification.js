import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";
import { networkService } from '../../../Utils/NetworkService'; 

/**
 * Custom hook for notification-related operations
 */
const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  /**
   * Send a test notification
   * @param {string} type - The notification type (slack, discord, telegram, webhook)
   * @param {object} config - Configuration object with necessary params
   */
  const sendTestNotification = async (type, config) => {
    setLoading(true);
    setError(null);
    
    // Validation based on notification type
    let payload = { platform: type };
    let isValid = true;
    let errorMessage = '';
    
    switch(type) {
      case 'slack':
        payload.webhookUrl = config.webhook;
        if (!payload.webhookUrl) {
          isValid = false;
          errorMessage = t('notifications.slack.webhookRequired', 'Please enter a Slack webhook URL first.');
        }
        break;
        
      case 'discord':
        payload.webhookUrl = config.webhook;
        if (!payload.webhookUrl) {
          isValid = false;
          errorMessage = t('notifications.discord.webhookRequired', 'Please enter a Discord webhook URL first.');
        }
        break;
        
      case 'telegram':
        payload.botToken = config.token;
        payload.chatId = config.chatId;
        if (!payload.botToken || !payload.chatId) {
          isValid = false;
          errorMessage = t('notifications.telegram.fieldsRequired', 'Please enter both Telegram bot token and chat ID.');
        }
        break;
        
      case 'webhook':
        payload.webhookUrl = config.url;
        payload.platform = 'slack';
        if (!payload.webhookUrl) {
          isValid = false;
          errorMessage = t('notifications.webhook.urlRequired', 'Please enter a webhook URL first.');
        }
        break;
        
      default:
        isValid = false;
        errorMessage = t('notifications.unsupportedType', 'This notification type cannot be tested.');
    }

    // If validation fails, show error and return
    if (!isValid) {
      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    try {
      // Use your existing NetworkService to make the API call
      const response = await networkService.axiosInstance.post('/notifications/test-webhook', payload);
      
      if (response.data.success) {
        toast.success(t('notifications.testSuccess', 'Test notification sent successfully!'));
      } else {
        throw new Error(response.data.msg || t('notifications.testFailed', 'Failed to send test notification'));
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message || t('notifications.networkError', 'Network error occurred');
      toast.error(`${t('notifications.testFailed', 'Failed to send test notification')}: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    sendTestNotification
  };
};

export default useNotifications;