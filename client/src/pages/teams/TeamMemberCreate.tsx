import { TeamMemberForm } from "./TeamMemberForm";

import { useParams } from "react-router";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { useNavigate } from "react-router";
import { mutate } from "swr";
import { useGetOnDemand } from "@/hooks/UseApi";
import type { IUser } from "@/types/user";
import { useAppDispatch } from "@/hooks/AppHooks";
import { setUser } from "@/features/authSlice";
const TeamMemberCreate = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { get: getOnDemand } = useGetOnDemand<IUser>();
  const { id } = useParams();
  const { response } = useGet<ApiResponse<any>>("/team-members?type=org");
  const { response: rolesResponse } =
    useGet<ApiResponse<any>>("/roles?type=team");
  const { post } = usePost<ApiResponse<any>>();
  const teamMembers = response?.data || [];
  const roles = rolesResponse?.data || [];

  const onSubmit = async (data: any) => {
    const res = await post("/team-members", { ...data });
    if (res) {
      mutate("/teams/joined");
      const me = await getOnDemand("/me");
      if (me?.data) {
        dispatch(setUser(me.data));
      }
      navigate(-1);
    }
  };

  return (
    <TeamMemberForm
      initialData={{
        userId: teamMembers?.[0]?.userId?._id,
        roleId: roles?.[0]?._id,
        teamId: id,
      }}
      teamMembers={teamMembers}
      roles={roles}
      onSubmit={onSubmit}
      loading={false}
      breadcrumbOverride={["teams", id || "", "create"]}
    />
  );
};

export default TeamMemberCreate;
