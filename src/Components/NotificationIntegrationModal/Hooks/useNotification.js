import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";
import { networkService } from '../../../Utils/NetworkService'; 

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

/**
 * Custom hook for notification-related operations
 */
const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);
  const { t } = useTranslation();

  /**
   * Send a test notification
   * @param {string} type - The notification type (slack, discord, telegram, webhook)
   * @param {object} config - Configuration object with necessary params
   */
  const sendTestNotification = async (type, config) => {
    setLoading(true);
    setError(undefined);
    
    // Validation based on notification type
    let payload = { platform: type };
    let isValid = true;
    let errorMessage = '';
    
    switch(type) {
      case NOTIFICATION_TYPES.SLACK:
        payload.webhookUrl = config.webhook;
        if (typeof payload.webhookUrl === 'undefined' || payload.webhookUrl === '') {
          isValid = false;
          errorMessage = t('notifications.slack.webhookRequired');
        }
        break;
        
      case NOTIFICATION_TYPES.DISCORD:
        payload.webhookUrl = config.webhook;
        if (typeof payload.webhookUrl === 'undefined' || payload.webhookUrl === '') {
          isValid = false;
          errorMessage = t('notifications.discord.webhookRequired');
        }
        break;
        
      case NOTIFICATION_TYPES.TELEGRAM:
        payload.botToken = config.token;
        payload.chatId = config.chatId;
        if (typeof payload.botToken === 'undefined' || payload.botToken === '' || 
            typeof payload.chatId === 'undefined' || payload.chatId === '') {
          isValid = false;
          errorMessage = t('notifications.telegram.fieldsRequired');
        }
        break;
        
      case NOTIFICATION_TYPES.WEBHOOK:
        payload.webhookUrl = config.url;
        payload.platform = NOTIFICATION_TYPES.SLACK; 
        if (typeof payload.webhookUrl === 'undefined' || payload.webhookUrl === '') {
          isValid = false;
          errorMessage = t('notifications.webhook.urlRequired');
        }
        break;
        
      default:
        isValid = false;
        errorMessage = t('notifications.unsupportedType');
    }

    // If validation fails, show error and return
    if (isValid === false) {
      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    try {
      const response = await networkService.axiosInstance.post('/notifications/test-webhook', payload);
      
      if (response.data.success === true) {
        toast.success(t('notifications.testSuccess'));
      } else {
        throw new Error(response.data.msg || t('notifications.testFailed'));
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message || t('notifications.networkError');
      toast.error(`${t('notifications.testFailed')}: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return [
    loading,
    error,
    sendTestNotification
  ];
};

export default useNotifications;