import Stack from "@mui/material/Stack";
import { TextInput } from "@/components/inputs";
import { Button } from "@/components/inputs";
import Typography from "@mui/material/Typography";

import { useForm, Controller } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useInitForm } from "@/hooks/forms/UseInitRegisterForm";

import { registerSchema } from "@/validation/zod";
type FormData = z.infer<typeof registerSchema>;

export const RegisterForm = ({
  mode = "register",
  hasUser = false,
  initialData,
  onSubmit,
  loading,
  error,
}: {
  mode?: "register" | "invite";
  hasUser?: boolean;
  initialData?: Partial<FormData>;
  onSubmit: SubmitHandler<FormData>;
  loading: boolean;
  error: string | null;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { defaults } = useInitForm({ initialData: initialData });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    reset(defaults);
  }, [initialData, reset, defaults]);

  if (hasUser && mode === "invite") {
    return (
      <Button
        variant="contained"
        color="accent"
        onClick={() => onSubmit(defaults)}
      >
        Accept invite
      </Button>
    );
  }

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
      <Controller
        name="email"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <TextInput
            disabled={mode === "invite"}
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
        disabled={defaults.firstName ? true : false}
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
        disabled={defaults.lastName ? true : false}
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
            placeholder="••••••••••"
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
            placeholder={t("auth.common.inputs.passwordConfirm.placeholder")}
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
        {mode === "invite" ? "Accept invitation" : "Register"}
      </Button>
      {error && <Typography color="error">{error}</Typography>}
    </Stack>
  );
};
