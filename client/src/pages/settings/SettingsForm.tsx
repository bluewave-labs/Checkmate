import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button, TextInput, Switch, TextLink } from "@/components/inputs";
import { ConfigBox } from "@/components/design-elements";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { systemSettingsSchema } from "@/validation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useInitForm } from "@/hooks/forms/UseInitSettingsForm";
import { useEffect } from "react";

export type FormValues = z.infer<typeof systemSettingsSchema>;

export const SettingsForm = ({
  initialData,
  onSubmitEmail,
  onSubmitRetention,
  onTest,
  loading,
}: {
  initialData?: Partial<FormValues>;
  onSubmitEmail: SubmitHandler<FormValues>;
  onSubmitRetention: SubmitHandler<FormValues>;
  onTest: (data: Partial<FormValues>) => Promise<void>;
  loading?: boolean;
}) => {
  const { defaults } = useInitForm({ initialData: initialData });
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(systemSettingsSchema) as any,
    defaultValues: defaults,
    mode: "onChange",
  });

  const formValues = watch();

  useEffect(() => {
    reset(defaults);
  }, [initialData, reset, defaults]);

  return (
    <Stack spacing={theme.spacing(10)}>
      <Stack
        spacing={theme.spacing(10)}
        component="form"
        onSubmit={handleSubmit(onSubmitEmail)}
      >
        <ConfigBox
          title={t("adminSettings.form.email.title")}
          subtitle={t("adminSettings.form.email.description")}
          leftContent={
            <Stack>
              <TextLink
                text={t("adminSettings.form.email.descriptionTransport")}
                linkText={t("adminSettings.form.email.linkTransport")}
                href="https://nodemailer.com/smtp"
                target="_blank"
              />
              <Box
                component={"pre"}
                sx={{
                  fontFamily: "monospace",
                  p: 2,
                  borderRadius: 1,
                  overflow: "auto",
                }}
              >
                <code>
                  {JSON.stringify(
                    {
                      host: formValues.systemEmailHost,
                      port: formValues.systemEmailPort,
                      secure: formValues.systemEmailSecure,
                      auth: {
                        user:
                          formValues.systemEmailUser ||
                          formValues.systemEmailAddress,
                        pass: "<your_password>",
                      },
                      name: formValues.systemEmailConnectionHost || "localhost",
                      pool: formValues.systemEmailPool,
                      tls: {
                        rejectUnauthorized:
                          formValues.systemEmailRejectUnauthorized,
                        ignoreTLS: formValues.systemEmailIgnoreTLS,
                        requireTLS: formValues.systemEmailRequireTLS,
                        servername: formValues.systemEmailTLSServername,
                      },
                    },
                    null,
                    2
                  )}
                </code>
              </Box>
            </Stack>
          }
          rightContent={
            <Stack spacing={theme.spacing(10)}>
              <Controller
                name="systemEmailHost"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="text"
                    fieldLabel={t("adminSettings.form.email.optionHost")}
                    fullWidth
                    error={!!errors.systemEmailHost}
                    helperText={
                      errors.systemEmailHost
                        ? errors.systemEmailHost.message
                        : ""
                    }
                  />
                )}
              />
              <Controller
                name="systemEmailPort"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="number"
                    fieldLabel={t("adminSettings.form.email.optionPort")}
                    fullWidth
                    error={!!errors.systemEmailPort}
                    helperText={
                      errors.systemEmailPort
                        ? errors.systemEmailPort.message
                        : ""
                    }
                  />
                )}
              />
              <Controller
                name="systemEmailUser"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="text"
                    fieldLabel={t("adminSettings.form.email.optionUser")}
                    fullWidth
                    error={!!errors.systemEmailUser}
                    helperText={
                      errors.systemEmailUser
                        ? errors.systemEmailUser.message
                        : ""
                    }
                  />
                )}
              />
              <Controller
                name="systemEmailAddress"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="text"
                    fieldLabel={t("adminSettings.form.email.optionAddress")}
                    fullWidth
                    error={!!errors.systemEmailAddress}
                    helperText={
                      errors.systemEmailAddress
                        ? errors.systemEmailAddress.message
                        : ""
                    }
                  />
                )}
              />
              <Controller
                name="systemEmailPassword"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="password"
                    fieldLabel={t("adminSettings.form.email.optionPassword")}
                    fullWidth
                    error={!!errors.systemEmailPassword}
                    helperText={
                      errors.systemEmailPassword
                        ? errors.systemEmailPassword.message
                        : ""
                    }
                  />
                )}
              />
              <Controller
                name="systemEmailTLSServername"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="text"
                    fieldLabel={t(
                      "adminSettings.form.email.optionTLSServername"
                    )}
                    fullWidth
                    error={!!errors.systemEmailTLSServername}
                    helperText={
                      errors.systemEmailTLSServername
                        ? errors.systemEmailTLSServername.message
                        : ""
                    }
                  />
                )}
              />
              <Controller
                name="systemEmailConnectionHost"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="text"
                    fieldLabel={t(
                      "adminSettings.form.email.optionConnectionHost"
                    )}
                    fullWidth
                    error={!!errors.systemEmailConnectionHost}
                    helperText={
                      errors.systemEmailConnectionHost
                        ? errors.systemEmailConnectionHost.message
                        : ""
                    }
                  />
                )}
              />
              <Controller
                name="systemEmailSecure"
                control={control}
                render={({ field }) => (
                  <Stack direction="row" alignItems={"center"}>
                    <Switch {...field} checked={field.value} />
                    <Typography>
                      {t("adminSettings.form.email.optionSecure")}
                    </Typography>
                  </Stack>
                )}
              />
              <Controller
                name="systemEmailPool"
                control={control}
                render={({ field }) => (
                  <Stack direction="row" alignItems={"center"}>
                    <Switch {...field} checked={field.value} />

                    <Typography>
                      {t("adminSettings.form.email.optionPool")}
                    </Typography>
                  </Stack>
                )}
              />
              <Controller
                name="systemEmailIgnoreTLS"
                control={control}
                render={({ field }) => (
                  <Stack direction="row" alignItems={"center"}>
                    <Switch {...field} checked={field.value} />

                    <Typography>
                      {t("adminSettings.form.email.optionIgnoreTLS")}
                    </Typography>
                  </Stack>
                )}
              />
              <Controller
                name="systemEmailRequireTLS"
                control={control}
                render={({ field }) => (
                  <Stack direction="row" alignItems={"center"}>
                    <Switch {...field} checked={field.value} />

                    <Typography>
                      {t("adminSettings.form.email.optionRequireTLS")}
                    </Typography>
                  </Stack>
                )}
              />
              <Controller
                name="systemEmailRejectUnauthorized"
                control={control}
                render={({ field }) => (
                  <Stack direction="row" alignItems={"center"}>
                    <Switch {...field} checked={field.value} />

                    <Typography>
                      {t("adminSettings.form.email.optionRejectUnauthorized")}
                    </Typography>
                  </Stack>
                )}
              />
              <Stack
                gap={theme.spacing(4)}
                direction="row"
                justifyContent="flex-end"
              >
                <Button
                  loading={loading}
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    onTest(formValues);
                  }}
                >
                  {t("common.buttons.testTransport")}
                </Button>
                <Button
                  loading={loading}
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  {t("common.buttons.saveEmailSettings")}
                </Button>
              </Stack>
            </Stack>
          }
        />
      </Stack>
      <Stack
        component="form"
        onSubmit={handleSubmit(onSubmitRetention)}
        spacing={theme.spacing(10)}
      >
        <ConfigBox
          title={t("adminSettings.form.retention.title")}
          subtitle={t("adminSettings.form.retention.description")}
          rightContent={
            <Stack spacing={theme.spacing(10)}>
              <Controller
                name="checksRetentionDays"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="number"
                    fieldLabel={t(
                      "adminSettings.form.retention.optionRetentionDays"
                    )}
                    fullWidth
                    error={!!errors.checksRetentionDays}
                    helperText={
                      errors.checksRetentionDays
                        ? errors.checksRetentionDays.message
                        : ""
                    }
                  />
                )}
              />
              <Stack
                gap={theme.spacing(4)}
                direction="row"
                justifyContent="flex-end"
              >
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  loading={loading}
                >
                  Save retention settings
                </Button>
              </Stack>
            </Stack>
          }
        />
      </Stack>
    </Stack>
  );
};
