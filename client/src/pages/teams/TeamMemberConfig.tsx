import { TeamMemberForm } from "./TeamMemberForm";
import { Button } from "@/components/inputs";
import { Dialog } from "@/components/inputs";

import { useState } from "react";
import { useGet, usePatch, useGetOnDemand } from "@/hooks/UseApi";
import { useParams } from "react-router";
import type { ApiResponse } from "@/hooks/UseApi";
import { useNavigate } from "react-router";
import { useDelete } from "@/hooks/UseApi";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";
import type { IUser } from "@/types/user";
import { useAppDispatch } from "@/hooks/AppHooks";
import { setUser } from "@/features/authSlice";

const TeamMemberConfig = () => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const { deleteFn, loading: isDeleting } = useDelete();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id, memberId } = useParams();
  const { patch, loading } = usePatch();
  const { get: getOnDemand } = useGetOnDemand<IUser>();
  const dispatch = useAppDispatch();
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
      const me = await getOnDemand("/me");
      if (me?.data) {
        dispatch(setUser(me.data));
      }
      navigate(-1);
    }
  };

  const handleConfirm = async () => {
    const res = await deleteFn(`/team-members/${memberId}`);
    if (res) {
      mutate("/teams/joined");
      const me = await getOnDemand("/me");
      if (me?.data) {
        dispatch(setUser(me.data));
      }
      navigate(-1);
    }
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
            disabled={isDeleting}
          >
            {t("common.buttons.delete")}
          </Button>
        }
        breadcrumbOverride={["team-members", id || "", "configure"]}
      />
      <Dialog
        open={dialogOpen}
        title={t("common.dialog.delete.title")}
        content={t("common.dialog.delete.description")}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={isDeleting}
      />
    </>
  );
};

export default TeamMemberConfig;
