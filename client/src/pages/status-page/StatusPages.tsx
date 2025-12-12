import { HeaderCreate } from "@/components/common";
import { BasePageWithStates, InfoBox } from "@/components/design-elements";
import { Dialog } from "@/components/inputs";
import { StatusPageTable } from "@/pages/status-page/StatusPageTable";

import { useState } from "react";
import type { IStatusPage } from "@/types/status-page";
import { useGet, useDelete } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { useTranslation } from "react-i18next";

const StatusPages = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { t } = useTranslation();
  const [selectedStatusPage, setSelectedStatusPage] =
    useState<IStatusPage | null>(null);
  const open = Boolean(selectedStatusPage);

  const { response, isValidating, error, refetch } = useGet<
    ApiResponse<{ statusPages: IStatusPage[]; count: number }>
  >(`/status-pages?page=${page}&rowsPerPage=${rowsPerPage}`, {}, {});

  const statusPages = response?.data?.statusPages || [];
  const count = response?.data?.count || 0;

  const { deleteFn, loading: isDeleting } = useDelete<any>();

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
        isLoading={isValidating || isDeleting}
        path="/status-pages/create"
        entitlement="statusPagesMax"
        entitlementCount={statusPages.length}
      />
      <StatusPageTable
        statusPages={statusPages}
        setSelectedStatusPage={setSelectedStatusPage}
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        count={count}
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

export default StatusPages;
