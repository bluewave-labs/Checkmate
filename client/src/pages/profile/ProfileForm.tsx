import Stack from "@mui/material/Stack";
import { TextInput } from "@/components/inputs";
import { Button } from "@/components/inputs";

import { useForm, Controller } from "react-hook-form";
import type { Resolver, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useInitForm } from "@/hooks/forms/UseInitProfileForm";
import type { IUser } from "@/types/user";

import { profileSchema } from "@/validation/zod";
type FormData = z.infer<typeof profileSchema>;

export const ProfileForm = ({
  user,
  initialData,
  onSubmit,
  loading,
}: {
  user: Partial<IUser> | null;
  hasUser?: boolean;
  initialData?: Partial<FormData>;
  onSubmit: SubmitHandler<FormData>;
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { defaults } = useInitForm({ initialData: initialData });
  const resolver = zodResolver(profileSchema) as unknown as Resolver<FormData>;

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver,
    defaultValues: {
      firstName: "",
      lastName: "",
      password: undefined,
      confirmPassword: undefined,
    },
  });

  useEffect(() => {
    reset(defaults);
  }, [initialData, reset, defaults]);

  return (
    <Stack
      component="form"
      padding={theme.spacing(8)}
      gap={theme.spacing(12)}
      onSubmit={handleSubmit(onSubmit)}
      maxWidth={400}
      sx={{
        width: {
          sm: "80%",
          md: "70%",
          lg: "65%",
          xl: "65%",
        },
      }}
    >
      {/* Can add control later */}
      <TextInput
        value={user?.email || ""}
        disabled
        fieldLabel={t("auth.common.inputs.email.label")}
        fullWidth
        placeholder={t("auth.common.inputs.email.placeholder")}
      />
      <Controller
        name="firstName"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextInput
            {...field}
            fieldLabel={t("auth.common.inputs.firstName.label")}
            fullWidth
            placeholder={t("auth.common.inputs.firstName.placeholder")}
            error={!!errors.firstName}
            helperText={errors.firstName ? errors.firstName.message : ""}
          />
        )}
      />
      <Controller
        name="lastName"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextInput
            {...field}
            fieldLabel={t("auth.common.inputs.lastName.label")}
            fullWidth
            placeholder={t("auth.common.inputs.lastName.placeholder")}
            error={!!errors.lastName}
            helperText={errors.lastName ? errors.lastName.message : ""}
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextInput
            {...field}
            type="password"
            fieldLabel={t("auth.common.inputs.password.label")}
            fullWidth
            error={!!errors.password}
            helperText={errors.password ? errors.password.message : ""}
          />
        )}
      />
      <Controller
        name="confirmPassword"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextInput
            {...field}
            type="password"
            fieldLabel={t("auth.common.inputs.passwordConfirm.label")}
            fullWidth
            error={!!errors.confirmPassword}
            helperText={
              errors.confirmPassword ? errors.confirmPassword.message : ""
            }
          />
        )}
      />
      <Button
        variant="contained"
        loading={loading}
        color="accent"
        type="submit"
        sx={{ width: "100%", alignSelf: "center", fontWeight: 700 }}
      >
        Update profile
      </Button>
    </Stack>
  );
};
