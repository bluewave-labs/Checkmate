import { HeaderCreate } from "@/components/notification-channels/HeaderCreate";
import Typography from "@mui/material/Typography";
import { BasePageWithStates, InfoBox } from "@/components/design-elements";
import { Table } from "@/components/design-elements";
import { ActionsMenu } from "@/components/actions-menu";
import { Dialog } from "@/components/inputs";

import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import type { ActionMenuItem } from "@/components/actions-menu";
import type { Header } from "@/components/design-elements/Table";
import type { IStatusPage } from "@/types/status-page";
import { useGet, useDelete } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { useTranslation } from "react-i18next";

const StatusPages = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedStatusPage, setSelectedStatusPage] =
    useState<IStatusPage | null>(null);
  const open = Boolean(selectedStatusPage);

  const { response, isValidating, error, refetch } = useGet<
    ApiResponse<IStatusPage[]>
  >("/status-pages", {}, {});

  const statusPages = response?.data || [];

  const { deleteFn, loading: deleting } = useDelete<any>();

  const getActions = (statusPage: IStatusPage): ActionMenuItem[] => {
    return [
      {
        id: 1,
        label: "Configure",
        action: () => {
          navigate(`/status-pages/${statusPage._id}/configure`);
        },
        closeMenu: true,
      },
      {
        id: 7,
        label: <Typography color={theme.palette.error.main}>Remove</Typography>,
        action: async () => {
          setSelectedStatusPage(statusPage);
        },
        closeMenu: true,
      },
    ];
  };

  const getHeaders = () => {
    const headers: Header<IStatusPage>[] = [
      {
        id: "name",
        content: "Name",
        render: (row) => {
          return <Typography>{row?.name}</Typography>;
        },
      },
      {
        id: "published",
        content: "Published",
        render: (row) => {
          const published = row.isPublished ? "Yes" : "No";
          return <Typography>{published}</Typography>;
        },
      },
      {
        id: "url",
        content: "Public URL",
        render: (row) => {
          return (
            <Typography textTransform={"capitalize"}>{row?.url}</Typography>
          );
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

  const handleConfirm = async () => {
    if (!selectedStatusPage) return;
    const res = await deleteFn(`/status-pages/${selectedStatusPage._id}`);
    if (res) {
      setSelectedStatusPage(null);
      refetch();
    }
  };

  const handleCancel = () => {
    setSelectedStatusPage(null);
  };

  return (
    <BasePageWithStates
      page="Status Pages"
      loading={false}
      bullets={
        t("statusPage.fallback.checks", { returnObjects: true }) as string[]
      }
      error={error}
      items={statusPages}
      actionButtonText="Create a new status page"
      actionLink="/status-pages/create"
    >
      <InfoBox
        title="Public Status Pages"
        description="Create beautiful, branded status pages to keep your users informed about service health. Share real-time status updates and incident reports with your customers."
      />
      <HeaderCreate
        label={"Create a new Status Page"}
        isLoading={isValidating || deleting}
        path="/status-pages/create"
      />
      <Table
        headers={headers}
        data={statusPages}
        onRowClick={(row) => {
          navigate(`/status-pages/${row._id}`);
        }}
      />

      <Dialog
        title={t("createStatusPage.dialogDeleteTitle")}
        content={t("createStatusPage.dialogDeleteContent")}
        open={open}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </BasePageWithStates>
  );
};

export default StatusPages;
