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
import type { INotificationChannel } from "@/types/notification-channel";
import { useGet, usePatch, useDelete } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { useTranslation } from "react-i18next";

const NotificationChannelsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedChannel, setSelectedChannel] =
    useState<INotificationChannel | null>(null);
  const open = Boolean(selectedChannel);

  const { response, isValidating, error, refetch } = useGet<
    ApiResponse<INotificationChannel[]>
  >("/notification-channels", {}, {});

  const { patch, loading: pausing } = usePatch<{}, INotificationChannel>();
  const { deleteFn, loading: deleting } =
    useDelete<ApiResponse<INotificationChannel>>();

  const notificationChannels = response?.data || [];

  const handleConfirm = async () => {
    if (!selectedChannel) return;
    const res = await deleteFn(`/notification-channels/${selectedChannel._id}`);
    if (res) {
      setSelectedChannel(null);
      refetch();
    }
  };

  const handleCancel = () => {
    setSelectedChannel(null);
  };

  const getActions = (channel: INotificationChannel): ActionMenuItem[] => {
    return [
      {
        id: 1,
        label: "Configure",
        action: () => {
          navigate(`/notification-channels/${channel._id}/configure`);
        },
        closeMenu: true,
      },
      {
        id: 2,
        label: channel.isActive ? "Disable" : "Enable",
        action: async () => {
          const res = await patch(
            `/notification-channels/${channel._id}/active`,
            {}
          );
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
          setSelectedChannel(channel);
        },
        closeMenu: true,
      },
    ];
  };

  const getHeaders = () => {
    const headers: Header<INotificationChannel>[] = [
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
        id: "type",
        content: "Type",
        render: (row) => {
          return (
            <Typography textTransform={"capitalize"}>{row?.type}</Typography>
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

  return (
    <BasePageWithStates
      page="Notification Channels"
      bullets={
        t("notifications.fallback.checks", { returnObjects: true }) as string[]
      }
      loading={isValidating}
      error={error}
      items={notificationChannels}
      actionButtonText="Create a new notification channel"
      actionLink="/notification-channels/create"
    >
      <InfoBox
        title="Alert Destinations"
        description="Configure where you want to receive alerts when monitors detect issues. Connect email, Slack, Discord, webhooks, and other channels to stay informed."
      />
      <HeaderCreate
        label={"Create a new notification channel"}
        isLoading={isValidating || pausing || deleting}
        path="/notification-channels/create"
      />
      <Table
        headers={headers}
        data={notificationChannels}
        onRowClick={(row) => {
          navigate(`/notification-channels/${row._id}/configure`);
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

export default NotificationChannelsPage;
