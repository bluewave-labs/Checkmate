import Stack from "@mui/material/Stack";
import {
  TextInput,
  Button,
  AutoComplete,
  RadioWithDescription,
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
          title={t("distributedUptimeCreateChecks")}
          subtitle={t("distributedUptimeCreateChecksDescription")}
          rightContent={
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.type}>
                  <RadioGroup {...field} sx={{ gap: theme.spacing(6) }}>
                    <RadioWithDescription
                      value="https"
                      label="HTTPS"
                      description="Use HTTPS to monitor your website or API endpoint.
"
                    />
                    <RadioWithDescription
                      value="http"
                      label={"HTTP"}
                      description={
                        "Use HTTP to monitor your website or API endpoint."
                      }
                    />
                    <RadioWithDescription
                      value="ping"
                      label={t("pingMonitoring")}
                      description={t("pingMonitoringDescription")}
                    />
                  </RadioGroup>
                </FormControl>
              )}
            />
          }
        />
      )}
      <ConfigBox
        title={t("settingsGeneralSettings")}
        subtitle={t(`uptimeGeneralInstructions.${selectedType}`)}
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
                  fieldLabel={t("url")}
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
                  fieldLabel={t("displayName")}
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
        title={t("createMonitorPage.incidentConfigTitle")}
        subtitle={t("createMonitorPage.incidentConfigDescriptionV2")}
        rightContent={
          <Controller
            name="n"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                type="number"
                fieldLabel={t("createMonitorPage.incidentConfigStatusCheckNumber")}
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
        title={t("notificationConfig.title")}
        subtitle={t("notificationConfig.description")}
        rightContent={
          <Stack>
            <Controller
              name="notificationChannels"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <AutoComplete
                  multiple
                  fieldLabel={`You have ${notificationOptions.length} available notification ${notificationOptions.length === 1 ? 'channel' : 'channels'}`}
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
        title={t("createMonitorPage.intervalTitle")}
        subtitle="How often to check the URL"
        rightContent={
          <Controller
            name="interval"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                type="text"
                fieldLabel={t("createMonitorPage.intervalDescription")}
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
          color="accent"
        >
          {t("settingsSave")}
        </Button>
      </Stack>
    </BasePage>
  );
};
