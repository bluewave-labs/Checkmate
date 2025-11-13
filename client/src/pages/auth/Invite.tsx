import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { Button, TextInput, Select } from "@/components/inputs";
import { BasePage, ConfigBox } from "@/components/design-elements";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { inviteSchema } from "@/validation/zod";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
const host = import.meta.env.VITE_APP_HOST;

type FormValues = z.infer<typeof inviteSchema>;

const Invite = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [token, setToken] = useState<string | null>(null);
  const { post, loading } = usePost<FormValues, any>();
  const onSubmit = async (data: FormValues) => {
    const res = await post("/invite", data);
    if (res) {
      setToken(res.data);
    }
  };

  const { response } = useGet<ApiResponse<any>>("/roles");
  const roles = response?.data;
  const orgRoles = useMemo(
    () => roles?.filter((role: any) => role.scope === "organization"),
    [roles]
  );
  const teamRoles = useMemo(
    () => roles?.filter((role: any) => role.scope === "team"),
    [roles]
  );

  const { response: teamsResponse } = useGet<ApiResponse<any>>("/teams");
  const teams = teamsResponse?.data;

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      teamId: "",
      teamRoleId: "",
      orgRoleId: "",
    },
  });

  useEffect(() => {
    reset({
      teamId: teams?.[0]?._id || "",
      teamRoleId: teamRoles?.[0]?._id || "",
    });
  }, [teams, teamRoles, reset]);

  return (
    <BasePage component="form" onSubmit={handleSubmit(onSubmit)}>
      <ConfigBox
        title="Required"
        subtitle="These fields are required"
        rightContent={
          <Stack gap={theme.spacing(4)} maxWidth={400}>
            <Controller
              name="email"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextInput
                  {...field}
                  fieldLabel={t("auth.common.inputs.email.label")}
                  fullWidth
                  placeholder={t("auth.common.inputs.email.placeholder")}
                  error={!!errors.email}
                  helperText={errors.email ? errors.email.message : ""}
                />
              )}
            />
            <Controller
              name="teamId"
              control={control}
              render={({ field }) => {
                return (
                  <Stack gap={theme.spacing(8)}>
                    <Select
                      value={field.value}
                      fieldLabel="Team"
                      error={!!errors.teamId}
                      onChange={field.onChange}
                    >
                      {teams?.map((team: any) => {
                        return (
                          <MenuItem key={team._id} value={team._id}>
                            {team.name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </Stack>
                );
              }}
            />
            <Controller
              name="teamRoleId"
              control={control}
              render={({ field }) => {
                const currentRole = teamRoles?.find(
                  (role: any) => role._id === field.value
                );
                return (
                  <Stack gap={theme.spacing(8)}>
                    <Select
                      value={field.value}
                      fieldLabel="Team role"
                      error={!!errors.teamRoleId}
                      onChange={field.onChange}
                    >
                      {teamRoles?.map((role: any) => {
                        return (
                          <MenuItem key={role._id} value={role._id}>
                            {role.name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    <Stack>
                      <Typography mb={theme.spacing(4)}>
                        {currentRole && `Permissions:`}
                      </Typography>
                      {currentRole?.permissions?.map((perm: string) => (
                        <Typography variant="body2" key={perm}>
                          - {perm}
                        </Typography>
                      ))}
                    </Stack>
                  </Stack>
                );
              }}
            />
          </Stack>
        }
      />

      <ConfigBox
        title="Optional"
        subtitle="You can also assign an organization role"
        rightContent={
          <Stack gap={theme.spacing(4)} maxWidth={400}>
            <Controller
              name="orgRoleId"
              control={control}
              render={({ field }) => {
                const currentOrgRole = orgRoles?.find(
                  (role: any) => role._id === field.value
                );
                return (
                  <Stack gap={theme.spacing(8)}>
                    <Select
                      value={field.value}
                      fieldLabel="Organization role"
                      error={!!errors.orgRoleId}
                      onChange={field.onChange}
                    >
                      {orgRoles?.map((role: any) => {
                        return (
                          <MenuItem key={role._id} value={role._id}>
                            {role.name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    <Stack>
                      <Typography mb={theme.spacing(4)}>
                        {currentOrgRole && `Permissions:`}
                      </Typography>
                      {currentOrgRole?.permissions?.map((perm: string) => (
                        <Typography variant="body2" key={perm}>
                          - {perm}
                        </Typography>
                      ))}
                    </Stack>
                  </Stack>
                );
              }}
            />
          </Stack>
        }
      />
      {token && (
        <Stack>
          <Typography variant="h2">Invite link:</Typography>
          <Typography>{`${host}/register/${token}`}</Typography>
        </Stack>
      )}
      <Box flex={1}>
        <Button
          loading={loading}
          variant="contained"
          color="accent"
          type="submit"
        >
          Send Invite
        </Button>
      </Box>
    </BasePage>
  );
};

export default Invite;
