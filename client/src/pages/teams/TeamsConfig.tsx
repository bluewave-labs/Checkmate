import { TeamsForm } from "@/pages/teams/TeamsForm";

import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { teamSchema } from "@/validation/zod";
import { useGet, usePatch } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";

const TeamsConfigPage = () => {
  type FormValues = Omit<z.infer<typeof teamSchema>, "roleId">;
  const navigate = useNavigate();
  const { response } = useGet<ApiResponse<any>>("/roles?type=team");
  const { patch, loading } = usePatch<FormValues, ApiResponse<any>>();

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
