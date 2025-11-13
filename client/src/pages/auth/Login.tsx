import { AuthBasePage } from "@/components/auth";
import { Button, TextInput, TextLink } from "@/components/inputs";
import Stack from "@mui/material/Stack";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePost } from "@/hooks/UseApi";
import { useNavigate } from "react-router";
import { useTheme } from "@mui/material/styles";
import { useAppDispatch } from "@/hooks/AppHooks";
import { useTranslation } from "react-i18next";
import {
  setAuthenticated,
  setUser,
  setSelectedTeamId,
  logout,
} from "@/features/authSlice";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import type { IUser } from "@/types/user";

const schema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const Login = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { post, loading } = usePost<FormData, IUser>();
  const navigate = useNavigate();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    const result = await post("/auth/login", data);

    if (!result) {
      dispatch(logout());
      navigate("/login");
    }

    const user = result?.data || null;
    if (!user) {
      dispatch(logout());
      navigate("/login");
      return;
    }

    dispatch(setAuthenticated(true));
    dispatch(setUser(user));
    dispatch(setSelectedTeamId(user.teams[0]?.id || null));
    navigate("/");
  };

  return (
    <AuthBasePage
      title={t("auth.login.welcome")}
      subtitle={t("auth.login.heading")}
    >
      <Stack
        width={"100%"}
        alignItems={"center"}
        justifyContent={"center"}
        gap={theme.spacing(8)}
      >
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
          <Button
            variant="contained"
            loading={loading}
            color="accent"
            type="submit"
            sx={{ width: "100%", alignSelf: "center", fontWeight: 700 }}
          >
            Login
          </Button>
        </Stack>
        <TextLink
          text={t("auth.login.links.forgotPassword")}
          linkText={t("auth.login.links.forgotPasswordLink")}
          href="/recovery"
        />
        <TextLink
          text={t("auth.login.links.register")}
          linkText={t("auth.login.links.registerLink")}
          href="/register"
        />
      </Stack>
    </AuthBasePage>
  );
};

export default Login;
