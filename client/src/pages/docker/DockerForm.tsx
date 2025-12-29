import Stack from "@mui/material/Stack";
import { TextInput, Button, AutoComplete } from "@/components/inputs";
import { ConfigBox, BasePage } from "@/components/design-elements";
import { Trash2 } from "lucide-react";
import { Typography } from "@mui/material";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { monitorSchemaDocker } from "@/validation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  Controller,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import { useTheme } from "@mui/material/styles";
import { useInitDockerForm } from "@/hooks/forms/UseInitDockerForm";
import type { IMonitor } from "@/types/monitor";

export type FormValues = z.infer<typeof monitorSchemaDocker>;
export type SubmitValues = Omit<FormValues, "interval"> & {
  interval: number | undefined;
};

export const DockerForm = ({
  mode = "create",
  initialData,
  onSubmit,
  notificationOptions,
  loading,
}: {
  mode?: "create" | "configure";
  initialData?: IMonitor;
  onSubmit: SubmitHandler<SubmitValues>;
  notificationOptions: any[];
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { defaults, formToApi } = useInitDockerForm({ initialData });

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(monitorSchemaDocker) as any,
    defaultValues: defaults as any,
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaults as any);
  }, [initialData, reset, defaults]);

  const notificationChannels = useWatch({
    control,
    name: "notificationChannels",
  });

  const submitForm = (formData: FormValues) => {
    onSubmit(formToApi(formData) as any);
  };

  return (
    <BasePage component={"form"} onSubmit={handleSubmit(submitForm)}>
      <ConfigBox
        title={t("monitors.common.form.general.title")}
        subtitle={t(`monitors.infrastructure.form.general.description`)}
        rightContent={
          <Stack gap={theme.spacing(8)}>
            <Controller
              disabled={mode === "configure"}
              name="url"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  type="text"
                  fieldLabel={t("monitors.common.form.optionUrl")}
                  fullWidth
                  error={!!errors.url}
                  helperText={errors.url ? errors.url.message : ""}
                />
              )}
            />

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  type="text"
                  fieldLabel={t("monitors.common.form.optionDisplayName")}
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name ? errors.name.message : ""}
                />
              )}
            />
            <Controller
              name="secret"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  type="text"
                  fieldLabel={t(
                    "monitors.infrastructure.form.general.optionSecret"
                  )}
                  fullWidth
                  error={!!errors.secret}
                  helperText={errors.secret ? errors.secret.message : ""}
                />
              )}
            />
          </Stack>
        }
      />
      <ConfigBox
        title={t("monitors.common.form.incidents.title")}
        subtitle={t("monitors.common.form.incidents.description")}
        rightContent={
          <Controller
            name="n"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                type="number"
                fieldLabel={t(
                  "monitors.common.form.incidents.optionIncidentCount"
                )}
                fullWidth
                error={!!errors.n}
                helperText={errors.n ? errors.n.message : ""}
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  field.onChange(target.valueAsNumber);
                }}
              />
            )}
          />
        }
      />
      <ConfigBox
        title={t("monitors.common.form.notifications.title")}
        subtitle={t("monitors.common.form.notifications.description")}
        rightContent={
          <Stack>
            <Controller
              name="notificationChannels"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <AutoComplete
                  multiple
                  options={notificationOptions}
                  getOptionLabel={(option) => option.name}
                  value={notificationOptions.filter((o: any) =>
                    (field.value || []).includes(o._id)
                  )}
                  onChange={(_, newValue) => {
                    field.onChange(newValue.map((o: any) => o._id));
                  }}
                />
              )}
            />
            <Stack gap={theme.spacing(2)} mt={theme.spacing(2)}>
              {notificationChannels.map((notificationId: string) => {
                const option = notificationOptions.find(
                  (o: any) => o._id === notificationId
                );
                if (!option) return null;
                return (
                  <Stack
                    width={"100%"}
                    justifyContent={"space-between"}
                    direction="row"
                    key={notificationId}
                  >
                    <Typography>{option.name}</Typography>
                    <Trash2
                      size={20}
                      strokeWidth={1.5}
                      onClick={() => {
                        const updated = notificationChannels.filter(
                          (id: string) => id !== notificationId
                        );
                        setValue("notificationChannels", updated);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </Stack>
                );
              })}
            </Stack>
          </Stack>
        }
      />
      <ConfigBox
        title={t("monitors.common.form.interval.title")}
        subtitle={t("monitors.common.form.interval.description")}
        rightContent={
          <Controller
            name="interval"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                type="text"
                fieldLabel={t("monitors.common.form.interval.optionInterval")}
                fullWidth
                error={!!errors.interval}
                helperText={errors.interval ? errors.interval.message : ""}
              />
            )}
          />
        }
      />
      <Stack direction="row" justifyContent="flex-end">
        <Button
          loading={loading}
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

export default DockerForm;
