import { AuthBasePage } from "@/components/auth";

import { useParams } from "react-router";
import { ResetForm } from "@/pages/recovery/ResetForm";
import { resetSchema } from "@/validation/zod";
import { z } from "zod";
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

type FormData = z.infer<typeof resetSchema>;

const Reset = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { post, loading } = usePost<{ password: string; token: string }>();
  const { toastSuccess } = useToast();
  const { id: token } = useParams<{ id: string }>();

  const onSubmit = async (data: FormData) => {
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

    toastSuccess("Password reset successful!");
    dispatch(setAuthenticated(true));
    dispatch(setUser(user));
    dispatch(setSelectedTeamId(user.teams[0]?.id || null));
    navigate("/");
  };

  return (
    <AuthBasePage title="Set a new password">
      <ResetForm onSubmit={onSubmit} loading={loading} />
    </AuthBasePage>
  );
};

export default Reset;
