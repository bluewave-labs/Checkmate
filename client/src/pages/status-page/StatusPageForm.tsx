import Stack from "@mui/material/Stack";
import { Button, FormControlLabel } from "@/components/inputs";
import { ConfigBox, BasePage } from "@/components/design-elements";
import { TextInput, AutoComplete, Checkbox } from "@/components/inputs";
import Typography from "@mui/material/Typography";
import { Trash2 } from "lucide-react";

import { useTheme } from "@mui/material/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { statusPageSchema } from "@/validation/zod";
import {
  useForm,
  Controller,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import { useEffect } from "react";
import { useInitForm } from "@/hooks/forms/UseInitStatusPageForm";
import type { IMonitor } from "@/types/monitor";

type FormValues = z.infer<typeof statusPageSchema>;

export const StatusPageForm = ({
  initialData,
  monitorOptions,
  onSubmit,
  loading,
}: {
  mode?: string;
  monitorOptions: IMonitor[];
  initialData?: Partial<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const { defaults } = useInitForm({ initialData: initialData });
  const theme = useTheme();

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(statusPageSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaults);
  }, [initialData, reset, defaults]);

  const onError = (errors: any) => {
    console.log(errors);
  };

  const monitors = useWatch({
    control,
    name: "monitors",
  });

  return (
    <BasePage component={"form"} onSubmit={handleSubmit(onSubmit, onError)}>
      <ConfigBox
        title={t("createStatusPage.basicConfigTitle")}
        subtitle={t("createStatusPage.basicConfigDescription")}
        rightContent={
          <Stack gap={theme.spacing(8)}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  type="text"
                  fieldLabel={t("createStatusPage.nameConfigLabel")}
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name ? errors.name.message : ""}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  type="text"
                  fieldLabel={t("createStatusPage.descriptionConfigLabel")}
                  fullWidth
                  error={!!errors.description}
                  helperText={
                    errors.description ? errors.description.message : ""
                  }
                />
              )}
            />
          </Stack>
        }
      />
      <ConfigBox
        title={t("createStatusPage.urlConfigTitle")}
        subtitle={t("createStatusPage.urlConfigDescription")}
        rightContent={
          <Controller
            name="url"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                type="text"
                fieldLabel={t("createStatusPage.urlConfigTitle")}
                fullWidth
                error={!!errors.url}
                helperText={errors.url ? errors.url.message : ""}
              />
            )}
          />
        }
      />
      <ConfigBox
        title={t("createStatusPage.accessConfigTitle")}
        subtitle={t("createStatusPage.accessConfigDescription")}
        rightContent={
          <Controller
            name="isPublished"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                label={t("createStatusPage.publishedConfigLabel")}
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
        }
      />
      <ConfigBox
        title={t("createMaintenanceWindowPage.monitorsTitle")}
        subtitle={t("createMaintenanceWindowPage.monitorsDescription")}
        rightContent={
          <Stack>
            <Controller
              name="monitors"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <AutoComplete
                  multiple
                  options={monitorOptions}
                  getOptionLabel={(option) => option.name}
                  value={monitorOptions.filter((o: any) =>
                    (field.value || []).includes(o._id)
                  )}
                  onChange={(_, newValue) => {
                    field.onChange(newValue.map((o: any) => o._id));
                  }}
                />
              )}
            />
            <Stack gap={theme.spacing(2)} mt={theme.spacing(2)}>
              {monitors.map((monitorId) => {
                const option = monitorOptions.find((o) => o._id === monitorId);
                if (!option) return null;
                return (
                  <Stack
                    width={"100%"}
                    justifyContent={"space-between"}
                    direction="row"
                    key={monitorId}
                  >
                    <Typography>{option.name}</Typography>
                    <Trash2
                      size={20}
                      strokeWidth={1.5}
                      onClick={() => {
                        const updated = monitors.filter(
                          (id) => id !== monitorId
                        );
                        setValue("monitors", updated);
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
