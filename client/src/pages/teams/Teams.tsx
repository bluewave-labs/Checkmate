import { BasePage, InfoBox } from "@/components/design-elements";
import { Table } from "@/components/design-elements";
import { HeaderCreate } from "@/components/common";
import { ActionsMenu } from "@/components/actions-menu";
import { Dialog } from "@/components/inputs";
import Typography from "@mui/material/Typography";

import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { ActionMenuItem } from "@/components/actions-menu";
import type { Header } from "@/components/design-elements/Table";
import type { ApiResponse } from "@/hooks/UseApi";
import { useGet, useDelete } from "@/hooks/UseApi";
import type { ITeam } from "@/types/team";
import { useState } from "react";
import { mutate } from "swr";
import { useTheme } from "@mui/material/styles";

const TeamsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<ITeam | null>(null);
  const isDialogOpen = Boolean(selectedTeam);
  const { t } = useTranslation();
  const { response, loading, refetch } = useGet<ApiResponse<any>>("/teams");
  const { deleteFn, loading: isDeleting } = useDelete();
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
        label: t("monitors.common.actions.configure"),
        action: () => {
          navigate(`/teams/${team._id}/configure`);
        },
        closeMenu: true,
      },
      {
        id: 2,
        label: (
          <Typography color={theme.palette.error.main}>
            {t("common.buttons.delete")}
          </Typography>
        ),
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
        content: t("common.table.headers.name"),
        render: (row) => {
          return row.name;
        },
      },
      {
        id: "description",
        content: t("teams.table.headers.teamDescription"),
        render: (row) => {
          return row.description;
        },
      },
      {
        id: "actions",
        content: t("common.table.headers.actions"),
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
        title={t("teams.infoBox.title")}
        description={t("teams.infoBox.description")}
      />
      <HeaderCreate
        label="Create new team"
        isLoading={loading}
        path="/teams/create"
        entitlement="teamsMax"
        entitlementCount={teams.length}
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
        title={t("common.dialog.delete.title")}
        content={t("common.dialog.delete.description")}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={isDeleting}
      />
    </BasePage>
  );
};

export default TeamsPage;
