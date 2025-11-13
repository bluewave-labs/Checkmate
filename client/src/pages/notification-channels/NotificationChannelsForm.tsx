import Stack from "@mui/material/Stack";
import { Button } from "@/components/inputs";
import { ConfigBox, BasePage } from "@/components/design-elements";
import { TextInput, Select } from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";

import { usePost } from "@/hooks/UseApi";
import { useToast } from "@/hooks/UseToast";
import { ChannelTypes } from "@/types/notification-channel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { notificationChannelSchema } from "@/validation/zod";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { useInitForm } from "@/hooks/forms/UseInitNotificationsChannelForm";
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type FormValues = z.infer<typeof notificationChannelSchema>;

export const NotificationChannelsForm = ({
  initialData,
  onSubmit,
  loading,
}: {
  mode?: string;
  initialData?: Partial<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const { defaults } = useInitForm({ initialData: initialData });
  const { post, loading: isPosting } = usePost();
  const theme = useTheme();
  const { toastSuccess } = useToast();

  const {
    handleSubmit,
    control,
    reset,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(notificationChannelSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaults);
  }, [initialData, reset, defaults]);

  const type = watch("type");

  const onError = (errors: any) => {
    console.log(errors);
    console.log(getValues());
  };

  const handleTest = async () => {
    const isValid = await trigger();
    if (isValid) {
      const res = await post("/notification-channels/test", getValues());
      if (res) {
        toastSuccess("Success");
      }
    }
  };

  return (
    <BasePage component={"form"} onSubmit={handleSubmit(onSubmit, onError)}>
      <ConfigBox
        title={t("createNotifications.nameSettings.title")}
        subtitle={t("createNotifications.nameSettings.description")}
        rightContent={
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                type="text"
                fieldLabel={t("createNotifications.nameSettings.nameLabel")}
                placeholder="e.g. Production Alerts"
                fullWidth
                error={!!errors.name}
                helperText={errors.name ? errors.name.message : ""}
              />
            )}
          />
        }
      />
      <ConfigBox
        title={t("createNotifications.typeSettings.title")}
        subtitle={t("createNotifications.typeSettings.description")}
        rightContent={
          <Controller
            name="type"
            control={control}
            defaultValue={defaults.type}
            render={({ field }) => {
              return (
                <Select
                  value={field.value}
                  fieldLabel={t("createNotifications.typeSettings.title")}
                  error={!!errors.type}
                  onChange={field.onChange}
                >
                  {ChannelTypes.map((type: string) => {
                    return (
                      <MenuItem key={type} value={type}>
                        <Typography textTransform={"capitalize"}>
                          {type}
                        </Typography>
                      </MenuItem>
                    );
                  })}
                </Select>
              );
            }}
          />
        }
      />
      <ConfigBox
        title={type ? `${type} configuration` : "Config"}
        subtitle={
          type === "email"
            ? "Configure the email address where notifications will be sent"
            : type === "webhook"
            ? "Configure the webhook URL endpoint where notifications will be sent"
            : type === "slack"
            ? "Configure your Slack webhook URL. Create one in Slack: Settings & administration → Manage apps → Custom Integrations → Incoming Webhooks"
            : type === "discord"
            ? "Configure your Discord webhook URL. Create one in Discord: Server Settings → Integrations → Webhooks → New Webhook"
            : "Configure notification channel settings"
        }
        rightContent={
          type === "email" ? (
            <Controller
              name="config.emailAddress"
              control={control}
              defaultValue={defaults.config.emailAddress}
              render={({ field }) => {
                return (
                  <TextInput
                    {...field}
                    type="text"
                    fieldLabel={t(
                      "createNotifications.emailSettings.description"
                    )}
                    placeholder="e.g. john@example.com"
                    fullWidth
                    error={!!errors.config?.emailAddress}
                    helperText={
                      errors.config?.emailAddress
                        ? errors.config.emailAddress.message
                        : ""
                    }
                  />
                );
              }}
            />
          ) : (
            <Controller
              name="config.url"
              control={control}
              defaultValue={defaults.config.url}
              render={({ field }) => {
                const getPlaceholder = () => {
                  switch (type) {
                    case "slack":
                      return "https://hooks.slack.com/services/YOUR/WEBHOOK/URL";
                    case "discord":
                      return "https://discord.com/api/webhooks/YOUR/WEBHOOK/URL";
                    case "webhook":
                      return "https://your-server.com/webhook";
                    default:
                      return "https://example.com/webhook";
                  }
                };

                return (
                  <TextInput
                    {...field}
                    type="text"
                    fieldLabel={
                      type
                        ? `${
                            type.charAt(0).toUpperCase() + type.slice(1)
                          } webhook URL`
                        : "URL"
                    }
                    placeholder={getPlaceholder()}
                    fullWidth
                    error={!!errors.config?.url}
                    helperText={
                      errors.config?.url ? errors.config.url.message : ""
                    }
                  />
                );
              }}
            />
          )
        }
      />
      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={theme.spacing(2)}
      >
        <Button
          variant="contained"
          color="accent"
          onClick={handleTest}
          loading={isPosting || loading}
        >
          Test
        </Button>
        <Button
          loading={isPosting || loading}
          type="submit"
          variant="contained"
          color="accent"
        >
          {t("settingsSave")}
        </Button>
      </Stack>
    </BasePage>
  );
};
