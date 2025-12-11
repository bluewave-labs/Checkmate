import Stack from "@mui/material/Stack";
import {
  TextInput,
  Button,
  AutoComplete,
  RadioWithDescription,
  Switch,
} from "@/components/inputs";
import { ConfigBox, BasePage } from "@/components/design-elements";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import { Trash2 } from "lucide-react";
import { Typography } from "@mui/material";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { monitorSchema } from "@/validation/zod";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  Controller,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import { useTheme } from "@mui/material/styles";
import { useInitForm } from "@/hooks/forms/UseInitMonitorFrom";

type FormValues = z.infer<typeof monitorSchema>;

export const UptimeForm = ({
  mode = "create",
  initialData,
  onSubmit,
  notificationOptions,
  loading,
}: {
  mode?: "create" | "configure";
  initialData?: Partial<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
  notificationOptions: any[];
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { defaults } = useInitForm({ initialData: initialData });
  const urlInputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(monitorSchema) as any,
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaults);
  }, [initialData, reset, defaults]);

  const selectedType = useWatch({
    control,
    name: "type",
  });
  const url = useWatch({ control, name: "url" });

  const notificationChannels = useWatch({
    control,
    name: "notificationChannels",
  });

  useEffect(() => {
    if (!selectedType) return;

    if (selectedType !== "http" && selectedType !== "https") {
      setValue("url", "");
      return;
    }

    if (selectedType !== "http" && selectedType !== "https") return;

    if (!url) {
      setValue("url", `${selectedType}://`);
      return;
    }

    const hasProtocol = /^(http|https):\/\//i.test(url);

    if (hasProtocol) {
      const newUrl = url.replace(/^(http|https):\/\//i, `${selectedType}://`);
      if (newUrl !== url) setValue("url", newUrl);
    } else {
      setValue("url", `${selectedType}://${url}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, setValue]);

  useEffect(() => {
    const input = urlInputRef.current;
    if (input) {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [selectedType]);

  return (
    <BasePage component={"form"} onSubmit={handleSubmit(onSubmit)}>
      {mode === "create" && (
        <ConfigBox
          title={t("monitors.uptime.form.type.title")}
          subtitle={t("monitors.uptime.form.type.description")}
          rightContent={
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.type}>
                  <RadioGroup {...field} sx={{ gap: theme.spacing(6) }}>
                    <RadioWithDescription
                      value="https"
                      label={t("monitors.common.form.optionHttps")}
                      description={t(
                        "monitors.uptime.form.type.optionHttpsDescription"
                      )}
                    />
                    <RadioWithDescription
                      value="http"
                      label={t("monitors.common.form.optionHttp")}
                      description={t(
                        "monitors.uptime.form.type.optionHttpDescription"
                      )}
                    />
                    <RadioWithDescription
                      value="port"
                      label={t("monitors.uptime.form.type.optionPort")}
                      description={t(
                        "monitors.uptime.form.type.optionPortDescription"
                      )}
                    />
                    <RadioWithDescription
                      value="ping"
                      label={t("monitors.uptime.form.type.optionPing")}
                      description={t(
                        "monitors.uptime.form.type.optionPingDescription"
                      )}
                    />
                  </RadioGroup>
                </FormControl>
              )}
            />
          }
        />
      )}
      <ConfigBox
        title={t("monitors.common.form.general.title")}
        subtitle={t(`monitors.uptime.form.general.description.${selectedType}`)}
        rightContent={
          <Stack gap={theme.spacing(8)}>
            <Controller
              disabled={mode === "configure"}
              name="url"
              control={control}
              render={({ field }) => (
                <TextInput
                  inputRef={urlInputRef}
                  {...field}
                  onFocus={(e) => {
                    const input = e.target;
                    setTimeout(() => {
                      input.setSelectionRange(
                        input.value.length,
                        input.value.length
                      );
                    }, 0);
                  }}
                  type="text"
                  fieldLabel={t("monitors.common.form.optionUrl")}
                  fullWidth
                  error={!!errors.url}
                  helperText={errors.url ? errors.url.message : ""}
                />
              )}
            />
            {selectedType === "port" && (
              <Controller
                name="port"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="number"
                    fieldLabel={t("monitors.uptime.form.general.optionPort")}
                    fullWidth
                    error={!!errors.port}
                    helperText={errors.port ? errors.port.message : ""}
                  />
                )}
              />
            )}
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
                  fieldLabel={t(
                    "monitors.common.form.notifications.optionNotificationChannels",
                    {
                      count: notificationOptions.length,
                    }
                  )}
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
              {notificationChannels.map((notificationId) => {
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
                          (id) => id !== notificationId
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
      <ConfigBox
        title={t("monitors.uptime.form.rejectUnauthorized.title")}
        subtitle={t("monitors.uptime.form.rejectUnauthorized.description")}
        rightContent={
          <Controller
            name="rejectUnauthorized"
            control={control}
            render={({ field }) => (
              <Stack direction="row" alignItems={"center"}>
                <Switch {...field} checked={field.value} />
                <Typography>
                  {field.value
                    ? t("monitors.uptime.form.rejectUnauthorized.optionEnabled")
                    : t(
                        "monitors.uptime.form.rejectUnauthorized.optionDisabled"
                      )}
                </Typography>
              </Stack>
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
