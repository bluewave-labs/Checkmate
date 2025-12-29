import { AuthBasePage } from "@/components/auth";

import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { ResetForm } from "@/pages/recovery/ResetForm";
import { usePost } from "@/hooks/UseApi";
import { useToast } from "@/hooks/UseToast";
import { useNavigate } from "react-router";
import { useAppDispatch } from "@/hooks/AppHooks";
import {
  setAuthenticated,
  setUser,
  setSelectedTeamId,
  logout,
} from "@/features/authSlice";
import type { FormValues } from "@/pages/recovery/ResetForm";

const Reset = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { post, loading } = usePost<{ password: string; token: string }>();
  const { toastSuccess } = useToast();
  const { id: token } = useParams<{ id: string }>();

  const onSubmit = async (data: FormValues) => {
    const result = await post(`/recovery/reset`, {
      password: data.password,
      token: token || "",
    });

    const user = result?.data || null;
    if (!user) {
      dispatch(logout());
      navigate("/login");
      return;
    }

    toastSuccess(t("common.toasts.passwordResetSuccessful"));
    dispatch(setAuthenticated(true));
    dispatch(setUser(user));
    dispatch(setSelectedTeamId(user.teams[0]?.id || null));
    navigate("/");
  };

  return (
    <AuthBasePage title={t("auth.reset.header.title")}>
      <ResetForm onSubmit={onSubmit} loading={loading} />
    </AuthBasePage>
  );
};

export default Reset;
