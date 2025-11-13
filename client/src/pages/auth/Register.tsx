import { AuthBasePage } from "@/components/auth";
import Stack from "@mui/material/Stack";
import { RegisterForm } from "./RegisterForm";

import {
  setAuthenticated,
  setUser,
  setSelectedTeamId,
  logout,
} from "@/features/authSlice";
import { useAppDispatch } from "@/hooks/AppHooks";
import { useTranslation } from "react-i18next";
import { usePost } from "@/hooks/UseApi";
import { useNavigate } from "react-router";
import { z } from "zod";
import { registerSchema } from "@/validation/zod";

type FormData = z.infer<typeof registerSchema>;
const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { post, loading, error } = usePost<Partial<FormData>, any>();

  const dispatch = useAppDispatch();

  const onSubmit = async (data: FormData) => {
    const submit = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    const result = await post("/auth/register", submit);

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
      title={t("auth.registration.welcome")}
      subtitle={t("auth.registration.heading.user")}
    >
      <Stack alignItems={"center"} width={"100%"}>
        <RegisterForm onSubmit={onSubmit} loading={loading} error={error} />
      </Stack>
    </AuthBasePage>
  );
};

export default Register;
