import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { Button, TextInput, Switch, TextLink } from "@/components/inputs";
import { ConfigBox } from "@/components/design-elements";

import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { systemSettingsSchema } from "@/validation/zod";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useInitForm } from "@/hooks/forms/UseInitSettingsForm";
import { useEffect } from "react";
import { Typography } from "@mui/material";
type FormValues = z.infer<typeof systemSettingsSchema>;

export const SettingsForm = ({
  initialData,
  onSubmit,
  onTest,
  loading,
}: {
  initialData?: Partial<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
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
    <Stack
      spacing={theme.spacing(10)}
      component="form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <ConfigBox
        title={t("settingsPage.emailSettings.title")}
        subtitle={t("settingsPage.emailSettings.description")}
        leftContent={
          <Stack>
            <TextLink
              text={t("settingsPage.emailSettings.descriptionTransport")}
              linkText={t("settingsPage.emailSettings.linkTransport")}
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
                  fieldLabel={t("settingsPage.emailSettings.labelHost")}
                  fullWidth
                  error={!!errors.systemEmailHost}
                  helperText={
                    errors.systemEmailHost ? errors.systemEmailHost.message : ""
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
                  fieldLabel={t("settingsPage.emailSettings.labelPort")}
                  fullWidth
                  error={!!errors.systemEmailPort}
                  helperText={
                    errors.systemEmailPort ? errors.systemEmailPort.message : ""
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
                  fieldLabel={t("settingsPage.emailSettings.labelUser")}
                  fullWidth
                  error={!!errors.systemEmailUser}
                  helperText={
                    errors.systemEmailUser ? errors.systemEmailUser.message : ""
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
                  fieldLabel={t("settingsPage.emailSettings.labelAddress")}
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
                  fieldLabel={t("settingsPage.emailSettings.labelPassword")}
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
                    "settingsPage.emailSettings.labelTLSServername"
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
                    "settingsPage.emailSettings.labelConnectionHost"
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
                    {t("settingsPage.emailSettings.labelSecure")}
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
                    {t("settingsPage.emailSettings.labelPool")}
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
                    {t("settingsPage.emailSettings.labelIgnoreTLS")}
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
                    {t("settingsPage.emailSettings.labelRequireTLS")}
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
                    {t("settingsPage.emailSettings.labelRejectUnauthorized")}
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
                color="accent"
                onClick={() => {
                  onTest(formValues);
                }}
              >
                Test transport config
              </Button>
              <Button
                loading={loading}
                type="submit"
                variant="contained"
                color="accent"
              >
                Save e-mail settings
              </Button>
            </Stack>
          </Stack>
        }
      />
    </Stack>
  );
};
