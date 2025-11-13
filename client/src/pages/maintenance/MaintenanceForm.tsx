import Stack from "@mui/material/Stack";
import { Button, DateTimePicker } from "@/components/inputs";
import { ConfigBox, BasePage, InfoBox } from "@/components/design-elements";
import { TextInput, Select, AutoComplete } from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useTheme } from "@mui/material/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { MaintenanceRepeats } from "@/types/maintenance";
import { maintenanceSchema } from "@/validation/zod";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { useInitForm } from "@/hooks/forms/UseInitMaintenanceForm";
import type { IMonitor } from "@/types/monitor";

type FormValues = z.infer<typeof maintenanceSchema>;

export const MaintenanceForm = ({
  monitorOptions,
  initialData,
  onSubmit,
  loading,
}: {
  monitorOptions: IMonitor[];
  initialData?: Partial<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { defaults } = useInitForm({ initialData: initialData });

  const {
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaults);
  }, [initialData, reset, defaults]);

  const onError = (errors: any) => {
    console.log(errors);
    console.log(getValues());
  };

  return (
    <BasePage component={"form"} onSubmit={handleSubmit(onSubmit, onError)}>
      <InfoBox
        title="About Maintenance Windows"
        description="During maintenance windows, all monitoring is suspended for selected monitors. No network checks will be performed, preventing any status updates or notifications from being triggered. Your monitors will appear frozen at their last known status, and status pages will display a maintenance indicator. Once the maintenance window ends, monitoring automatically resumes, and alerts will trigger if issues are detected. Maintenance periods do not count against uptime calculations."
      />
      <ConfigBox
        title={t("createMaintenanceWindowPage.generalSettingsTitle")}
        subtitle={t("createMaintenanceWindowPage.generalSettingsDescription")}
        rightContent={
          <Stack spacing={theme.spacing(8)}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  fieldLabel={t(
                    "createMaintenanceWindowPage.generalSettingsName"
                  )}
                  required
                  type="text"
                  placeholder={t(
                    "createMaintenanceWindowPage.generalSettingsNamePlaceholder"
                  )}
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name ? errors.name.message : ""}
                />
              )}
            />
            <Controller
              name="repeat"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  fieldLabel={t(
                    "createMaintenanceWindowPage.generalSettingsRepeat"
                  )}
                  required
                  error={!!errors.repeat}
                  onChange={field.onChange}
                  fullWidth
                >
                  {MaintenanceRepeats.map((option) => {
                    return (
                      <MenuItem key={option} value={option}>
                        <Typography textTransform={"capitalize"}>
                          {option}
                        </Typography>
                      </MenuItem>
                    );
                  })}
                </Select>
              )}
            />
          </Stack>
        }
      />
      <ConfigBox
        title={t("createMaintenanceWindowPage.timingSettingsTitle")}
        subtitle={t("createMaintenanceWindowPage.timingSettingsDescription")}
        rightContent={
          <Stack spacing={theme.spacing(8)}>
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => {
                const value = field.value ? dayjs(field.value) : null;
                return (
                  <>
                    <DateTimePicker
                      {...field}
                      fieldLabel="Start time"
                      required
                      value={value}
                      onChange={(val: Dayjs | null) =>
                        field.onChange(val?.toDate())
                      }
                    />
                    {errors?.startTime?.message && (
                      <Typography color="error" variant="caption">
                        {errors.startTime.message}
                      </Typography>
                    )}
                  </>
                );
              }}
            />
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => {
                const value = field.value ? dayjs(field.value) : null;
                return (
                  <>
                    <DateTimePicker
                      {...field}
                      fieldLabel="End time"
                      required
                      value={value}
                      onChange={(val: Dayjs | null) =>
                        field.onChange(val?.toDate())
                      }
                    />
                    {errors?.endTime?.message && (
                      <Typography color="error" variant="caption">
                        {errors.endTime.message}
                      </Typography>
                    )}
                  </>
                );
              }}
            />
          </Stack>
        }
      />
      <ConfigBox
        title={t("createMaintenanceWindowPage.monitorsTitle")}
        subtitle={t("createMaintenanceWindowPage.monitorsDescription")}
        rightContent={
          <Controller
            name="monitors"
            control={control}
            defaultValue={[]}
            render={({ field }) => {
              const selectedMonitors = monitorOptions.filter((o: any) =>
                (field.value || []).includes(o._id)
              );
              const count = selectedMonitors.length;

              return (
                <AutoComplete
                  multiple
                  fieldLabel="Monitors"
                  required
                  options={monitorOptions}
                  getOptionLabel={(option) => option.name}
                  value={selectedMonitors}
                  onChange={(_, newValue) => {
                    field.onChange(newValue.map((o: any) => o._id));
                  }}
                  renderInput={(params) => (
                    <TextInput
                      {...params}
                      placeholder={
                        count > 0 ? `${count} selected` : "Type to search"
                      }
                    />
                  )}
                />
              );
            }}
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
