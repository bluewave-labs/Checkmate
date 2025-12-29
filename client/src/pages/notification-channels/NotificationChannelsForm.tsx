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
import { notificationChannelSchema } from "@/validation";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { useInitForm } from "@/hooks/forms/UseInitNotificationsChannelForm";
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export type FormValues = z.infer<typeof notificationChannelSchema>;

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
    console.error(errors);
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
        title={t("notificationChannels.form.name.title")}
        subtitle={t("notificationChannels.form.name.description")}
        rightContent={
          <Controller
            name="name"
            control={control}
            defaultValue={defaults.name}
            render={({ field }) => (
              <TextInput
                {...field}
                type="text"
                fieldLabel={t("notificationChannels.form.name.optionName")}
                placeholder={t("notificationChannels.form.name.placeholder")}
                fullWidth
                error={!!errors.name}
                helperText={errors.name ? errors.name.message : ""}
              />
            )}
          />
        }
      />
      <ConfigBox
        title={t("notificationChannels.form.type.title")}
        subtitle={t("notificationChannels.form.type.description")}
        rightContent={
          <Controller
            name="type"
            control={control}
            defaultValue={defaults.type}
            render={({ field }) => {
              return (
                <Select
                  value={field.value}
                  fieldLabel={t("notificationChannels.form.type.optionType")}
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
        title={t(`notificationChannels.form.${type}.title`)}
        subtitle={t(`notificationChannels.form.${type}.description`)}
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
                    fieldLabel={t(`notificationChannels.form.${type}.option`)}
                    placeholder={t(
                      `notificationChannels.form.${type}.placeholder`
                    )}
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
                return (
                  <TextInput
                    {...field}
                    type="text"
                    fieldLabel={t(`notificationChannels.form.${type}.option`)}
                    placeholder={t(
                      `notificationChannels.form.${type}.placeholder`
                    )}
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
          color="primary"
          onClick={handleTest}
          loading={isPosting || loading}
        >
          {t("common.buttons.test")}
        </Button>
        <Button
          loading={isPosting || loading}
          type="submit"
          variant="contained"
          color="primary"
        >
          {t("common.buttons.save")}
        </Button>
      </Stack>
    </BasePage>
  );
};
