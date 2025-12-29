import Stack from "@mui/material/Stack";
import {
  TextInput,
  Button,
  RadioWithDescription,
  AutoComplete,
} from "@/components/inputs";
import RadioGroup from "@mui/material/RadioGroup";

import { ConfigBox, BasePage } from "@/components/design-elements";
import { Trash2 } from "lucide-react";
import { Typography } from "@mui/material";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { monitorSchemaPageSpeed } from "@/validation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  Controller,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import { useTheme } from "@mui/material/styles";
import { useInitForm } from "@/hooks/forms/UseInitPageSpeedForm";
import type { IMonitor } from "@/types/monitor";

export type FormValues = z.infer<typeof monitorSchemaPageSpeed>;
export type SubmitValues = Omit<
  z.infer<typeof monitorSchemaPageSpeed>,
  "interval"
> & {
  interval: number | undefined;
};

export const PageSpeedForm = ({
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
  const { defaults, formToApi } = useInitForm({ initialData: initialData });
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<string>("https");

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(monitorSchemaPageSpeed) as any,
    defaultValues: defaults,
    mode: "onChange",
  });

  const url = useWatch({ control, name: "url" });

  useEffect(() => {
    reset(defaults);
    if (defaults.url.startsWith("http://")) {
      setSelectedProtocol("http");
    }
  }, [initialData, reset, defaults]);

  useEffect(() => {
    if (!url) {
      setValue("url", `${selectedProtocol}://`);
    }

    const hasProtocol = /^(http|https):\/\//i.test(url);
    if (hasProtocol) {
      const newUrl = url.replace(
        /^(http|https):\/\//i,
        `${selectedProtocol}://`
      );
      if (newUrl !== url) setValue("url", newUrl);
    } else {
      setValue("url", `${selectedProtocol}://${url}`);
    }
  }, [selectedProtocol, setValue, url]);

  useEffect(() => {
    const input = urlInputRef.current;
    if (input) {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [selectedProtocol]);

  const notificationChannels =
    useWatch({ control, name: "notificationChannels" }) || [];

  const submitForm = (data: FormValues) => onSubmit(formToApi(data) as any);

  return (
    <BasePage component={"form"} onSubmit={handleSubmit(submitForm)}>
      <ConfigBox
        title={t("monitors.common.form.general.title")}
        subtitle={t("monitors.pageSpeed.form.general.description")}
        rightContent={
          <Stack gap={theme.spacing(8)}>
            <RadioGroup
              value={selectedProtocol}
              sx={{ gap: theme.spacing(6) }}
              onChange={(e) => {
                setSelectedProtocol(e.target.value);
              }}
            >
              <RadioWithDescription
                value="https"
                label={t("monitors.common.form.optionHttps")}
                description=""
              />
              <RadioWithDescription
                value="http"
                label={t("monitors.common.form.optionHttp")}
                description={""}
              />
            </RadioGroup>
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
