import Stack from "@mui/material/Stack";
import { Button, FormControlLabel } from "@/components/inputs";
import { ConfigBox, BasePage } from "@/components/design-elements";
import { TextInput, AutoComplete, Checkbox } from "@/components/inputs";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import { Select } from "@/components/inputs";

import { useTheme } from "@mui/material/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  useForm,
  Controller,
  useWatch,
  type SubmitHandler,
  type FieldErrors,
} from "react-hook-form";
import { useEffect } from "react";
import type { IMonitor } from "@/types/monitor";

export const IncidentFormSchema = z.object({
  monitorId: z.string().min(1, "Monitor is required"),
  startedAt: z.string().min(1, "Incident start time is required"),
  endedAt: z.string().optional(),
  resolved: z.boolean(),
  resolutionType: z.string().optional(),
  resolutionNote: z.string().optional(),
});

type FormValues = z.infer<typeof IncidentFormSchema>;

interface IncidentFormProps {
  monitorOptions: IMonitor[];
  initialData?: Partial<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
  loading: boolean;
}

export const IncidentForm = ({
  monitorOptions,
  initialData,
  onSubmit,
  loading,
}: IncidentFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const defaults: FormValues = {
    monitorId: initialData?.monitorId || "",
    startedAt: initialData?.startedAt || new Date().toISOString().slice(0, 16),
    endedAt: initialData?.endedAt || "",
    resolved: initialData?.resolved ?? false,
    resolutionType: initialData?.resolutionType || "",
    resolutionNote: initialData?.resolutionNote || "",
  };

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(IncidentFormSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaults);
  }, [initialData]);

  const onError = (errors: FieldErrors<FormValues>) => {
    console.error("Form validation errors:", errors);
  };

  const isResolved = useWatch({
    control,
    name: "resolved",
  });

  return (
    <BasePage component={"form"} onSubmit={handleSubmit(onSubmit, onError)}>
      {/* Monitor Selection */}
      <ConfigBox
        title={t("IncidentPage.form.monitor.title") || "Select Monitor"}
        subtitle={
          t("IncidentPage.form.monitor.description") ||
          "Choose which monitor this incident is associated with"
        }
        rightContent={
          <Controller
            name="monitorId"
            control={control}
            render={({ field }) => (
              <AutoComplete
                options={monitorOptions || []}
                getOptionLabel={(option: IMonitor) => option.name}
                value={
                  monitorOptions?.find((o: IMonitor) => o._id === field.value) ||
                  null
                }
                onChange={(_, newValue) => {
                  field.onChange((newValue as IMonitor)?._id || "");
                }}
                fieldLabel="Select affected monitor"
              />
            )}
          />
        }
      />

      {/* Incident Timeline */}
      <ConfigBox
        title={t("IncidentPage.form.timeline.title") || "Incident Timeline"}
        subtitle={
          t("IncidentPage.form.timeline.description") ||
          "When did the incident start and end"
        }
        rightContent={
          <Stack gap={theme.spacing(8)}>
            <Controller
              name="startedAt"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  type="datetime-local"
                  fieldLabel={
                    t("IncidentPage.form.timeline.optionStartTime") ||
                    "Incident Start"
                  }
                  fullWidth
                  error={!!errors.startedAt}
                  helperText={errors.startedAt?.message || ""}
                />
              )}
            />
            {isResolved && (
              <Controller
                name="endedAt"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    type="datetime-local"
                    fieldLabel={
                      t("IncidentPage.form.timeline.optionEndTime") ||
                      "Incident End"
                    }
                    fullWidth
                    error={!!errors.endedAt}
                    helperText={errors.endedAt?.message || ""}
                  />
                )}
              />
            )}
          </Stack>
        }
      />

      {/* Resolution Status */}
      <ConfigBox
        title={t("IncidentPage.form.resolution.title") || "Resolution Status"}
        subtitle={
          t("IncidentPage.form.resolution.description") ||
          "Mark the incident as resolved and add resolution details"
        }
        rightContent={
          <Stack gap={theme.spacing(8)}>
            <Controller
              name="resolved"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  label={
                    t("IncidentPage.form.resolution.optionResolved") ||
                    "Mark as Resolved"
                  }
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                />
              )}
            />
            {isResolved && (
              <Stack gap={theme.spacing(8)}>
                <Controller
                  name="resolutionType"
                  control={control}
                  render={({ field }) => (
                    <Stack gap={1}>
                      <Typography variant="body2" color="textSecondary">
                        {t(
                          "IncidentPage.form.resolution.optionType"
                        ) || "Resolution Type"}
                      </Typography>
                      <Select
                        {...field}
                        fullWidth
                        error={!!errors.resolutionType}
                      >
                        <MenuItem value="">Select resolution type</MenuItem>
                        <MenuItem value="monitoring">Monitoring</MenuItem>
                        <MenuItem value="acknowledged">Acknowledged</MenuItem>
                        <MenuItem value="identified">Identified</MenuItem>
                        <MenuItem value="investigating">Investigating</MenuItem>
                        <MenuItem value="fixed">Fixed</MenuItem>
                        <MenuItem value="workaround">Workaround</MenuItem>
                      </Select>
                    </Stack>
                  )}
                />
                <Controller
                  name="resolutionNote"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      type="text"
                      multiline
                      rows={4}
                      fieldLabel={
                        t("IncidentPage.form.resolution.optionNote") ||
                        "Resolution Note"
                      }
                      fullWidth
                      error={!!errors.resolutionNote}
                      helperText={errors.resolutionNote?.message || ""}
                    />
                  )}
                />
              </Stack>
            )}
          </Stack>
        }
      />

      {/* Submit Button */}
      <Stack direction="row" justifyContent="flex-end" gap={theme.spacing(4)}>
        <Button
          loading={loading}
          type="submit"
          variant="contained"
          color="primary"
        >
          {t("common.buttons.save") || "Create Incident"}
        </Button>
      </Stack>
    </BasePage>
  );
};
