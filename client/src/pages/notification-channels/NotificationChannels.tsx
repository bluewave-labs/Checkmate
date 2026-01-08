import { HeaderCreate } from "@/components/common";
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
import type { NotificationChannel } from "@/types/notification-channel";
import { useGet, usePatch, useDelete } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import { useTranslation } from "react-i18next";
import { config } from "@/config/index";

const NotificationChannelsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedChannel, setSelectedChannel] =
    useState<NotificationChannel | null>(null);
  const open = Boolean(selectedChannel);

  const { response, isValidating, error, refetch } = useGet<
    ApiResponse<NotificationChannel[]>
  >(
    "/notification-channels",
    {},
    {
      refreshInterval: config.GLOBAL_REFRESH,
      keepPreviousData: true,
      dedupingInterval: 0,
    },
    { useTeamIdAsKey: true }
  );

  const { patch, loading: pausing } = usePatch<{}, NotificationChannel>();
  const { deleteFn, loading: isDeleting } =
    useDelete<ApiResponse<NotificationChannel>>();

  const notificationChannels = response?.data || [];

  const handleConfirm = async () => {
    if (!selectedChannel) return;
    const res = await deleteFn(`/notification-channels/${selectedChannel.id}`);
    if (res) {
      setSelectedChannel(null);
      refetch();
    }
  };

  const handleCancel = () => {
    setSelectedChannel(null);
  };

  const getActions = (channel: NotificationChannel): ActionMenuItem[] => {
    return [
      {
        id: 1,
        label: t("monitors.common.actions.configure"),
        action: () => {
          navigate(`/notification-channels/${channel.id}/configure`);
        },
        closeMenu: true,
      },
      {
        id: 2,
        label: channel.isActive
          ? t("common.buttons.disable")
          : t("common.buttons.enable"),
        action: async () => {
          const res = await patch(
            `/notification-channels/${channel.id}/active`,
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
        label: (
          <Typography color={theme.palette.error.main}>
            {t("common.buttons.delete")}
          </Typography>
        ),
        action: async () => {
          setSelectedChannel(channel);
        },
        closeMenu: true,
      },
    ];
  };

  const getHeaders = () => {
    const headers: Header<NotificationChannel>[] = [
      {
        id: "name",
        content: t("common.table.headers.name"),
        render: (row) => {
          return <Typography>{row?.name}</Typography>;
        },
      },
      {
        id: "active",
        content: t("common.table.headers.active"),
        render: (row) => {
          const active = row.isActive
            ? t("common.buttons.yes")
            : t("common.buttons.no");
          return <Typography>{active}</Typography>;
        },
      },
      {
        id: "type",
        content: t("common.table.headers.type"),
        render: (row) => {
          return (
            <Typography textTransform={"capitalize"}>{row?.type}</Typography>
          );
        },
      },
      {
        id: "destination",
        content: t("notificationChannels.table.headers.destination"),
        render: (row) => {
          return (
            <Typography>
              {row?.config?.url || row?.config?.emailAddress}
            </Typography>
          );
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
    <BasePageWithStates
      page={t("notificationChannels.fallback.title")}
      bullets={
        t("notificationChannels.fallback.checks", {
          returnObjects: true,
        }) as string[]
      }
      loading={isValidating}
      error={error}
      items={notificationChannels}
      actionButtonText={t("notificationChannels.fallback.actionButton")}
      actionLink="/notification-channels/create"
    >
      <InfoBox
        title={t("notificationChannels.infoBox.title")}
        description={t("notificationChannels.infoBox.description")}
      />
      <HeaderCreate
        label={"Create a new notification channel"}
        isLoading={isValidating || pausing || isDeleting}
        path="/notification-channels/create"
        entitlement={"notificationChannelsMax"}
        entitlementCount={notificationChannels.length}
      />
      <Table
        headers={headers}
        data={notificationChannels}
        onRowClick={(row) => {
          navigate(`/notification-channels/${row.id}/configure`);
        }}
      />

      <Dialog
        title={t("common.dialog.delete.title")}
        content={t("common.dialog.delete.description")}
        open={open}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={isDeleting}
      />
    </BasePageWithStates>
  );
};

export default NotificationChannelsPage;
