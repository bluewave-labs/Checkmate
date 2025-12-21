import { IncidentForm, IncidentFormSchema } from "@/pages/incidents/IncidentFormPage";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useGet, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import type { IMonitor } from "@/types/monitor";
import { InfoBox } from "@/components/design-elements";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";

type FormValues = z.infer<typeof IncidentFormSchema>;

const IncidentCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch monitors for the form
  const { response: monitorResponse, isValidating } =
    useGet<ApiResponse<IMonitor[]>>(`/monitors`, {}, { keepPreviousData: true });

  // Post hook for creating incident
  const { post, loading } = usePost<FormValues>();

  const monitors: IMonitor[] = monitorResponse?.data || [];

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const res = await post("/incidents", data);
    if (res) {
      navigate("/incidents");
    }
  };

  return (
    <>
      <InfoBox
        title={t("IncidentPage.create.title") || "Create New Incident"}
        description={
          t("IncidentPage.create.description") ||
          "Manually create a new incident to track downtime or issues with your monitors."
        }
      />
      <IncidentForm
        monitorOptions={monitors}
        onSubmit={onSubmit}
        loading={loading || isValidating}
      />
    </>
  );
};

export default IncidentCreatePage;
