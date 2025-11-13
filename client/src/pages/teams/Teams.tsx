import { BasePage, InfoBox } from "@/components/design-elements";
import { Table } from "@/components/design-elements";
import { HeaderCreate } from "@/components/teams/HeaderCreate";
import { ActionsMenu } from "@/components/actions-menu";
import { Dialog } from "@/components/inputs";

import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { ActionMenuItem } from "@/components/actions-menu";
import type { Header } from "@/components/design-elements/Table";
import type { ApiResponse } from "@/hooks/UseApi";
import { useGet, useDelete } from "@/hooks/UseApi";
import type { ITeam } from "@/types/team";
import { useState } from "react";
import { mutate } from "swr";

const TeamsPage = () => {
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<ITeam | null>(null);
  const isDialogOpen = Boolean(selectedTeam);
  const { t } = useTranslation();
  const { response, loading, refetch } = useGet<ApiResponse<any>>("/teams");
  const { deleteFn } = useDelete();
  const teams = response?.data || [];

  const handleConfirm = async () => {
    await deleteFn(`/teams/${selectedTeam?._id}`);
    setSelectedTeam(null);
    refetch();
    mutate("/teams/joined");
  };
  const handleCancel = () => {
    setSelectedTeam(null);
  };

  const getActions = (team: ITeam): ActionMenuItem[] => {
    return [
      {
        id: 1,
        label: "Configure",
        action: () => {
          navigate(`/teams/${team._id}/configure`);
        },
        closeMenu: true,
      },
      {
        id: 2,
        label: "Delete",
        action: () => {
          setSelectedTeam(team);
        },
        closeMenu: true,
      },
    ];
  };

  const getHeaders = () => {
    const headers: Header<ITeam>[] = [
      {
        id: "name",
        content: "Team name",
        render: (row) => {
          return row.name;
        },
      },
      {
        id: "description",
        content: "Team description",
        render: (row) => {
          return row.description;
        },
      },
      {
        id: "actions",
        content: "Team description",
        render: (row) => {
          return <ActionsMenu items={getActions(row)} />;
        },
      },
    ];
    return headers;
  };

  const headers = getHeaders();

  return (
    <BasePage>
      <InfoBox
        title="Team Collaboration"
        description="Organize your monitoring workspace by creating teams. Control who can view and manage monitors, set up role-based permissions, and collaborate effectively."
      />
      <HeaderCreate
        label="Create new team"
        isLoading={loading}
        path="/teams/create"
      />
      <Table
        headers={headers}
        data={teams}
        onRowClick={(row) => {
          navigate(`/teams/${row._id}`);
        }}
      />
      <Dialog
        open={isDialogOpen}
        title={t("deleteDialogTitle")}
        content={t("deleteDialogDescription")}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </BasePage>
  );
};

export default TeamsPage;
