import { HeaderCreate } from "@/components/notification-channels/HeaderCreate";
import { BasePageWithStates, InfoBox } from "@/components/design-elements";
import { ActionsMenu } from "@/components/actions-menu";
import { Table } from "@/components/design-elements";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Dialog } from "@/components/inputs";

import { useState } from "react";
import { usePatch, useGet, useDelete } from "@/hooks/UseApi";
import { useNavigate } from "react-router";
import type { Header } from "@/components/design-elements/Table";
import { useTranslation } from "react-i18next";
import type { ApiResponse } from "@/hooks/UseApi";
import type { IMaintenance } from "@/types/maintenance";
import type { ActionMenuItem } from "@/components/actions-menu";

const MaintenancePage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<IMaintenance | null>(null);
  const open = Boolean(selectedMaintenance);

  const { patch, loading: isPausing } = usePatch<{}, any>();
  const { response, isValidating, refetch } = useGet<ApiResponse<any>>(
    "/maintenance",
    {},
    {}
  );
  const { deleteFn, loading: isDeleting } = useDelete<any>();

  const maintenance = response?.data || [];
  const navigate = useNavigate();

  const handleConfirm = async () => {
    if (!selectedMaintenance) return;
    const res = await deleteFn(`/maintenance/${selectedMaintenance._id}`);
    if (res) {
      setSelectedMaintenance(null);
      refetch();
    }
  };

  const handleCancel = () => {
    setSelectedMaintenance(null);
  };

  const getActions = (maintenance: IMaintenance): ActionMenuItem[] => {
    return [
      {
        id: 1,
        label: "Configure",
        action: () => {
          navigate(`/maintenance/${maintenance._id}/configure`);
        },
        closeMenu: true,
      },
      {
        id: 2,
        label: maintenance.isActive ? "Disable" : "Enable",
        action: async () => {
          const res = await patch(`/maintenance/${maintenance._id}/active`, {});
          if (res) {
            refetch();
          }
        },
        closeMenu: true,
      },
      {
        id: 7,
        label: <Typography color={theme.palette.error.main}>Remove</Typography>,
        action: async () => {
          setSelectedMaintenance(maintenance);
        },
        closeMenu: true,
      },
    ];
  };

  const getHeaders = () => {
    const headers: Header<IMaintenance>[] = [
      {
        id: "name",
        content: "Name",
        render: (row) => {
          return <Typography>{row?.name}</Typography>;
        },
      },
      {
        id: "active",
        content: "Active",
        render: (row) => {
          const active = row.isActive ? "Yes" : "No";
          return <Typography>{active}</Typography>;
        },
      },
      {
        id: "repeat",
        content: "Repeat",
        render: (row) => {
          const active = row.repeat ? row.repeat : "No";
          return <Typography textTransform={"capitalize"}>{active}</Typography>;
        },
      },
      {
        id: "actions",
        content: t("actions"),
        render: (row) => {
          return <ActionsMenu items={getActions(row)} />;
        },
      },
    ];
    return headers;
  };

  const headers = getHeaders();

  return (
    <BasePageWithStates
      page="Maintenance windows"
      loading={isValidating}
      error={null}
      items={maintenance}
      bullets={t("maintenanceWindow.fallback.checks", { returnObjects: true })}
      actionLink="/maintenance/create"
      actionButtonText={t("createMaintenanceWindow")}
    >
      <InfoBox
        title="Scheduled Maintenance Periods"
        description="Plan maintenance windows to temporarily pause monitoring checks. During maintenance, your monitors won't run checks or send notifications, preventing false alerts during planned downtime."
      />
      <HeaderCreate
        label={"Create a new maintenance window"}
        isLoading={isValidating || isPausing || isDeleting}
        path="/maintenance/create"
      />
      <Table
        headers={headers}
        data={maintenance}
        onRowClick={(row: IMaintenance) => {
          navigate(`/maintenance/${row._id}/configure`);
        }}
      />

      <Dialog
        title={t("createNotifications.dialogDeleteTitle")}
        content={t("createNotifications.dialogDeleteContent")}
        open={open}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </BasePageWithStates>
  );
};

export default MaintenancePage;
