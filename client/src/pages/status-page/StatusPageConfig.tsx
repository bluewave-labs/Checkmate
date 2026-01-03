import { StatusPageForm } from "@/pages/status-page/StatusPageForm";

import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { usePatch, useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { IMonitor } from "@/types/monitor";
import type {
  IStatusPage,
  IStatusPageWithChecksMap,
} from "@/types/status-page";
import type { FormValues } from "@/pages/status-page/StatusPageForm";

const StatusPageConfigPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { patch, loading } = usePatch<FormValues, IStatusPage>();
  const { response, isValidating } =
    useGet<ApiResponse<IMonitor[]>>("/monitors");
  const { response: statusPageResponse } = useGet<
    ApiResponse<IStatusPageWithChecksMap>
  >(`/status-pages/${id}`);

  const monitors = response?.data || [];
  const initialData: any = statusPageResponse?.data?.statusPage || {};
  initialData.monitors =
    initialData?.monitors?.map((monitor: any) => monitor?._id) || [];

  const onSubmit = async (data: FormValues) => {
    const res = await patch(`/status-pages/${id}`, data);
    if (res) {
      navigate(-1);
    }
  };
  return (
    <StatusPageForm
      initialData={initialData}
      monitorOptions={monitors}
      onSubmit={onSubmit}
      loading={loading || isValidating}
    />
  );
};

export default StatusPageConfigPage;
