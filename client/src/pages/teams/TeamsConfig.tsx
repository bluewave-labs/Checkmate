import { TeamsForm } from "@/pages/teams/TeamsForm";

import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { teamSchema } from "@/validation";
import { useGet, usePatch, useGetOnDemand } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { IUser } from "@/types/user";
import { useAppDispatch } from "@/hooks/AppHooks";
import { setUser } from "@/features/authSlice";
import { mutate } from "swr";

const TeamsConfigPage = () => {
  type FormValues = Omit<z.infer<typeof teamSchema>, "roleId">;
  const navigate = useNavigate();
  const { response } = useGet<ApiResponse<any>>("/roles?type=team");
  const { patch, loading } = usePatch<FormValues, ApiResponse<any>>();
  const { get: getOnDemand } = useGetOnDemand<IUser>();
  const dispatch = useAppDispatch();

  const { id } = useParams();
  const { response: teamResponse } = useGet<ApiResponse<any>>(`/teams/${id}`);
  const team = teamResponse?.data || null;
  const roles = response?.data || [];

  const onSubmit = async (data: FormValues) => {
    const toSubmit = {
      name: data.name,
      description: data.description,
    };
    await patch(`/teams/${id}`, toSubmit);
    mutate("/teams/joined");
    const me = await getOnDemand("/me");
    if (me?.data) {
      dispatch(setUser(me.data));
    }
    navigate("/teams");
  };

  return (
    <TeamsForm
      mode="config"
      initialData={{ ...team, roleId: roles[0]?._id }}
      onSubmit={onSubmit}
      loading={loading}
      roles={roles}
    />
  );
};

export default TeamsConfigPage;
