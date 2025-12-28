import { TeamsForm } from "@/pages/teams/TeamsForm";

import { useNavigate } from "react-router";
import { z } from "zod";
import { teamSchema } from "@/validation";
import { useGet, usePost, useGetOnDemand } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import { mutate } from "swr";
import type { IUser } from "@/types/user";
import { useAppDispatch } from "@/hooks/AppHooks";
import { setUser } from "@/features/authSlice";

const TeamsCreatePage = () => {
  type FormValues = z.infer<typeof teamSchema>;
  const { response } = useGet<ApiResponse<any>>("/roles?type=team");
  const { post, loading } = usePost<FormValues>();
  const navigate = useNavigate();
  const { get: getOnDemand } = useGetOnDemand<IUser>();
  const dispatch = useAppDispatch();

  const onSubmit = async (data: FormValues) => {
    await post("/teams", data);
    mutate("/teams/joined");
    const me = await getOnDemand("/me");
    if (me?.data) {
      dispatch(setUser(me.data));
    }
    navigate("/teams");
  };

  return (
    <TeamsForm
      onSubmit={onSubmit}
      loading={loading}
      roles={response?.data || []}
    />
  );
};

export default TeamsCreatePage;
