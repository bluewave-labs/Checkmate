import { TeamsForm } from "@/pages/teams/TeamsForm";

import { useNavigate } from "react-router";
import { z } from "zod";
import { teamSchema } from "@/validation/zod";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { mutate } from "swr";

const TeamsCreatePage = () => {
  type FormValues = z.infer<typeof teamSchema>;
  const { response } = useGet<ApiResponse<any>>("/roles?type=team");
  const { post, loading } = usePost<FormValues>();
  const navigate = useNavigate();

  const onSubmit = async (data: FormValues) => {
    await post("/teams", data);
    mutate("/teams/joined");
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
