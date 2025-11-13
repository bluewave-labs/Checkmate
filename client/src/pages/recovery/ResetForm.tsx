import Stack from "@mui/material/Stack";
import { TextInput } from "@/components/inputs";
import { Button } from "@/components/inputs";

import { useForm, Controller } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useInitForm } from "@/hooks/forms/UseInitResetForm";

import { resetSchema } from "@/validation/zod";
type FormData = z.infer<typeof resetSchema>;

export const ResetForm = ({
  initialData,
  onSubmit,
  loading,
}: {
  hasUser?: boolean;
  initialData?: Partial<FormData>;
  onSubmit: SubmitHandler<FormData>;
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
  } = useForm<FormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
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
        Submit new password
      </Button>
    </Stack>
  );
};
