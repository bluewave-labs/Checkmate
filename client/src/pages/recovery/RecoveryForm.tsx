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
import { useInitForm } from "@/hooks/forms/UseInitRegisterForm";

import { recoverySchema } from "@/validation/zod";
type FormData = z.infer<typeof recoverySchema>;

export const RecoveryForm = ({
  initialData,
  onSubmit,
  loading,
}: {
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
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: "",
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

      <Button
        variant="contained"
        loading={loading}
        color="accent"
        type="submit"
        sx={{ width: "100%", alignSelf: "center", fontWeight: 700 }}
      >
        Request recovery email
      </Button>
    </Stack>
  );
};
