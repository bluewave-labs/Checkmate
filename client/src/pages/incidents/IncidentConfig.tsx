import { IncidentForm, IncidentFormSchema } from "@/pages/incidents/IncidentFormPage";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { usePatch, useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import type { IMonitor } from "@/types/monitor";
import type { IIncident } from "@/types/incident";
import { InfoBox } from "@/components/design-elements";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";

type FormValues = z.infer<typeof IncidentFormSchema>;

const IncidentConfigPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch monitors for the form
  const { response: monitorResponse, isValidating: monitorsLoading } =
    useGet<ApiResponse<IMonitor[]>>(`/monitors`, {}, { keepPreviousData: true });

  // Fetch existing incident data
  const { response: incidentResponse, isValidating: incidentLoading } =
    useGet<ApiResponse<IIncident>>(`/incidents/${id}`);

  // Patch hook for updating incident
  const { patch, loading: patchLoading } = usePatch<FormValues>();

  const monitors: IMonitor[] = monitorResponse?.data || [];
  const incident = incidentResponse?.data;

  // Transform incident data to match form schema
  const initialData: Partial<FormValues> | undefined = incident
    ? {
        monitorId: typeof incident.monitorId === "string" 
          ? incident.monitorId 
          : incident.monitorId?._id,
        startedAt: incident.startedAt,
        endedAt: incident.endedAt,
        resolved: incident.resolved,
        resolutionType: incident.resolutionType,
        resolutionNote: incident.resolutionNote,
      }
    : undefined;

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const res = await patch(`/incidents/${id}`, data);
    if (res) {
      navigate(-1);
    }
  };

  return (
    <>
      <InfoBox
        title={t("IncidentPage.configure.title") || "Configure Incident"}
        description={
          t("IncidentPage.configure.description") ||
          "Update the incident details and resolution information."
        }
      />
      <IncidentForm
        initialData={initialData}
        monitorOptions={monitors}
        onSubmit={onSubmit}
        loading={patchLoading || monitorsLoading || incidentLoading}
      />
    </>
  );
};

export default IncidentConfigPage;
