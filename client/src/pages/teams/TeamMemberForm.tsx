import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { Button } from "@/components/inputs";
import { ConfigBox, BasePage } from "@/components/design-elements";
import { Select } from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";

import { useTheme } from "@mui/material/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { teamMemberSchema } from "@/validation/zod";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { useInitForm } from "@/hooks/forms/UseInitTeamMemberForm";

type FormValues = z.infer<typeof teamMemberSchema>;

export const TeamMemberForm = ({
  mode = "create",
  initialData,
  teamMembers = [],
  roles = [],
  onSubmit,
  loading,
  deleteButton,
  breadcrumbOverride,
}: {
  mode?: string;
  initialData?: Partial<FormValues>;
  teamMembers: any[];
  roles: any[];
  onSubmit: SubmitHandler<FormValues>;
  loading: boolean;
  deleteButton?: React.ReactNode;
  breadcrumbOverride?: string[];
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
    resolver: zodResolver(teamMemberSchema) as any,
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    reset(defaults);
  }, [initialData, reset, defaults]);

  return (
    <BasePage
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
      breadcrumbOverride={breadcrumbOverride}
    >
      <ConfigBox
        title="Team member"
        subtitle="Team member selection"
        rightContent={
          <Controller
            name="userId"
            control={control}
            render={({ field }) => {
              return (
                <Stack gap={theme.spacing(8)}>
                  <Select
                    disabled={mode !== "create"}
                    value={field.value}
                    fieldLabel="Team member"
                    error={!!errors.userId}
                    onChange={field.onChange}
                  >
                    {teamMembers.map((tm: any) => {
                      return (
                        <MenuItem key={tm._id} value={tm.userId?._id}>
                          {tm.userId?.firstName} {tm.userId?.lastName}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </Stack>
              );
            }}
          />
        }
      />
      <ConfigBox
        title="Role"
        subtitle="Choose your role for this new team.  You will be the first member"
        rightContent={
          <Controller
            name="roleId"
            control={control}
            render={({ field }) => {
              const selectedRole = roles.find(
                (role) => role._id === field.value
              );
              return (
                <Stack gap={theme.spacing(8)}>
                  <Select
                    value={field.value}
                    fieldLabel="Role"
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
      <Stack direction="row" justifyContent="flex-end" gap={theme.spacing(4)}>
        <Button
          loading={loading}
          type="submit"
          variant="contained"
          color="accent"
        >
          {t("settingsSave")}
        </Button>
        {deleteButton}
      </Stack>
    </BasePage>
  );
};
