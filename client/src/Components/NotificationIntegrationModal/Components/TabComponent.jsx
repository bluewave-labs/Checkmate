import React from "react";
import { 
  Typography, 
  Box,
  Button,
  CircularProgress
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTheme } from "@emotion/react";
import TextInput from "../../../Components/Inputs/TextInput";
import Checkbox from "../../../Components/Inputs/Checkbox";

const TabComponent = ({ 
  type, 
  integrations, 
  handleIntegrationChange, 
  handleInputChange, 
  handleTestNotification,
  isLoading 
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  // Helper to get the field state key (e.g., slackWebhook, telegramToken)
  const getFieldKey = (typeId, fieldId) => {
    return `${typeId}${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`;
  };
  
  // Check if all fields have values to enable test button
  const areAllFieldsFilled = () => {
    return type.fields.every(field => {
      const fieldKey = getFieldKey(type.id, field.id);
      return integrations[fieldKey];
    });
  };
  
  return (
    <>
      <Typography variant="subtitle1" component="h4" sx={{ 
        fontWeight: 'bold',
        color: theme.palette.primary.contrastTextSecondary
      }}>
        {type.label}
      </Typography>
      
      <Typography sx={{ 
        mt: theme.spacing(0.5), 
        mb: theme.spacing(1.5),
        color: theme.palette.primary.contrastTextTertiary 
      }}>
        {type.description}
      </Typography>
      
      <Box sx={{ pl: theme.spacing(1.5) }}> 
        <Checkbox
          id={`enable-${type.id}`}
          label={t('notifications.enableNotifications', { platform: type.label })}
          isChecked={integrations[type.id]}
          onChange={(e) => handleIntegrationChange(type.id, e.target.checked)}
          disabled={isLoading}
        />
      </Box>
      
      {type.fields.map(field => {
        const fieldKey = getFieldKey(type.id, field.id);
        
        return (
          <Box key={field.id} sx={{ mt: theme.spacing(1) }}>
            <Typography sx={{ 
              mb: theme.spacing(2), 
              fontWeight: 'bold',
              color: theme.palette.primary.contrastTextSecondary
            }}>
              {field.label}
            </Typography>
            
            <TextInput
              id={`${type.id}-${field.id}`}
              type={field.type}
              placeholder={field.placeholder}
              value={integrations[fieldKey]}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              disabled={!integrations[type.id] || isLoading}
            />
          </Box>
        );
      })}
      
      <Box sx={{ mt: theme.spacing(1) }}>
        <Button 
          variant="text" 
          color="info"
          onClick={() => handleTestNotification(type.id)}
          disabled={!integrations[type.id] || !areAllFieldsFilled() || isLoading}
        >
          {isLoading ? (
            <CircularProgress 
              size={theme.spacing(8)} 
              sx={{ mr: theme.spacing(1), color: theme.palette.accent.main}} 
            />
          ) : null}
          {t('notifications.testNotification')}
        </Button>
      </Box>
    </>
  );
};

export default TabComponent;