import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { Button } from "@/components/inputs";
import { ConfigBox, BasePage } from "@/components/design-elements";
import { TextInput, Select } from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";

import { useTheme } from "@mui/material/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { teamSchema } from "@/validation/zod";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { useInitForm } from "@/hooks/forms/UseInitTeamsForm";

type FormValues = z.infer<typeof teamSchema>;

export const TeamsForm = ({
  mode = "create",
  initialData,
  roles = [],
  onSubmit,
  loading,
}: {
  mode?: string;
  initialData?: Partial<FormValues>;
  roles: any[];
  onSubmit: SubmitHandler<FormValues>;
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { defaults } = useInitForm({ initialData: initialData });

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(teamSchema) as any,
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaults);
  }, [initialData, reset, defaults]);

  useEffect(() => {
    setValue("roleId", roles[0]?._id || "");
  }, [roles, setValue]);

  return (
    <BasePage component={"form"} onSubmit={handleSubmit(onSubmit)}>
      <ConfigBox
        title={t("createTeamsPage.basicInfoTitle")}
        subtitle={t("createTeamsPage.basicInfoSubtitle")}
        rightContent={
          <Stack gap={theme.spacing(8)}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  fieldLabel={t("createTeamsPage.basicInfoName")}
                  required
                  type="text"
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
                  fieldLabel={t("createTeamsPage.basicInfoDescription")}
                  type="text"
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
      {mode === "create" && (
        <ConfigBox
          title="Role"
          subtitle="Choose your role for this new team.  You will be the first member"
          rightContent={
            <Controller
              name="roleId"
              control={control}
              defaultValue={""} // important!
              render={({ field }) => {
                const selectedRole = roles.find(
                  (role) => role._id === field.value
                );
                return (
                  <Stack gap={theme.spacing(8)}>
                    <Select
                      value={field.value}
                      fieldLabel="Role"
                      required
                      error={!!errors.roleId}
                      onChange={field.onChange}
                    >
                      {roles.map((role: any) => {
                        return (
                          <MenuItem key={role._id} value={role._id}>
                            {role.name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    <Stack>
                      <Typography variant={"h2"} mb={theme.spacing(4)}>
                        Included permissions:
                      </Typography>
                      {selectedRole?.permissions?.map((perm: string) => (
                        <Typography key={perm}>- {perm}</Typography>
                      ))}
                    </Stack>
                  </Stack>
                );
              }}
            />
          }
        />
      )}
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
