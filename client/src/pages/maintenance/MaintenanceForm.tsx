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
import { maintenanceSchema } from "@/validation";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { useInitForm } from "@/hooks/forms/UseInitMaintenanceForm";
import type { IMonitor } from "@/types/monitor";

export type FormValues = z.infer<typeof maintenanceSchema>;

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
    console.error(errors);
  };

  return (
    <BasePage component={"form"} onSubmit={handleSubmit(onSubmit, onError)}>
      <InfoBox
        title={t("maintenanceWindow.infoBox.title")}
        description={t("maintenanceWindow.infoBox.description")}
      />
      <ConfigBox
        title={t("maintenanceWindow.form.general.title")}
        subtitle={t("maintenanceWindow.form.general.description")}
        rightContent={
          <Stack spacing={theme.spacing(8)}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  fieldLabel={t("maintenanceWindow.form.general.optionName")}
                  required
                  type="text"
                  placeholder={t(
                    "maintenanceWindow.form.general.optionNamePlaceholder"
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
                  fieldLabel={t("maintenanceWindow.form.general.optionRepeat")}
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
        title={t("maintenanceWindow.form.time.title")}
        subtitle={t("maintenanceWindow.form.time.description")}
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
                      fieldLabel={t("maintenanceWindow.form.time.optionStart")}
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
                      fieldLabel={t("maintenanceWindow.form.time.optionEnd")}
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
        title={t("maintenanceWindow.form.monitors.title")}
        subtitle={t("maintenanceWindow.form.monitors.description")}
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
                  fieldLabel={t(
                    "maintenanceWindow.form.monitors.optionMonitors"
                  )}
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
                        count > 0
                          ? `${count} ${t("maintenanceWindow.form.monitors.optionMonitorsSelected")}`
                          : t(
                              "maintenanceWindow.form.monitors.optionMonitorsPlaceholder"
                            )
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
          color="primary"
        >
          {t("common.buttons.save")}
        </Button>
      </Stack>
    </BasePage>
  );
};
