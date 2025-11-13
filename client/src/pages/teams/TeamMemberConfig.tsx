import { TeamMemberForm } from "./TeamMemberForm";
import { Button } from "@/components/inputs";
import { Dialog } from "@/components/inputs";

import { useState } from "react";
import { useGet, usePatch } from "@/hooks/UseApi";
import { useParams } from "react-router";
import type { ApiResponse } from "@/hooks/UseApi";
import { useNavigate } from "react-router";
import { useDelete } from "@/hooks/UseApi";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";

const TeamMemberConfig = () => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const { deleteFn, loading: deleting } = useDelete();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id, memberId } = useParams();
  const { patch, loading } = usePatch();
  const { response } = useGet<ApiResponse<any>>("/team-members");
  const { response: rolesResponse } =
    useGet<ApiResponse<any>>("/roles?type=team");
  const teamMembers = response?.data || [];
  const roles = rolesResponse?.data || [];

  const user = teamMembers?.find((tm: any) => tm._id === memberId);

  const onSubmit = async (data: any) => {
    const roleId = data.roleId;
    const res = await patch(`/team-members/${memberId}`, { roleId });
    if (res) {
      navigate(-1);
    }
  };

  const handleConfirm = async () => {
    await deleteFn(`/team-members/${id}`);
    mutate("/teams/joined");
    navigate(-1);
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <TeamMemberForm
        mode="config"
        initialData={{
          userId: user?.userId?._id,
          roleId: user?.roleId?._id,
          teamId: user?.teamId,
        }}
        teamMembers={teamMembers}
        roles={roles}
        onSubmit={onSubmit}
        loading={loading}
        deleteButton={
          <Button
            variant="contained"
            color="error"
            onClick={() => setDialogOpen(true)}
            disabled={deleting}
          >
            {t("delete")}
          </Button>
        }
        breadcrumbOverride={["teams", id || "", "configure team member"]}
      />
      <Dialog
        open={dialogOpen}
        title={"Are you sure?"}
        content={"Delete team member"}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};

export default TeamMemberConfig;
