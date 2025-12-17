import { BasePage, Tab, Tabs, InfoBox } from "@/components/design-elements";
import { DiagnosticsLogTab } from "@/pages/diagnostic/DiagnosticsLogTab";
import { DiagnosticsQueueTab } from "@/pages/diagnostic/DiagnosticsQueueTab";
import DiagnosticsConfigTab from "@/pages/diagnostic/DiagnosticsConfigTab";
import DiagnosticsAccessTab from "@/pages/diagnostic/DiagnosticsAccessTab";
import { FileText, ListTodo, Settings, Shield } from "lucide-react";

import { useState } from "react";
import { useTranslation } from "react-i18next";

const DiagnosticPage = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState("logs");

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <BasePage>
      <InfoBox
        title={t("diagnostics.infoBox.title")}
        description={t("diagnostics.infoBox.description")}
      />
      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab
          label={t("diagnostics.tabs.logs")}
          value="logs"
          icon={<FileText size={18} strokeWidth={1.5} />}
        />
        <Tab
          label={t("diagnostics.tabs.queue")}
          value="queue"
          icon={<ListTodo size={18} strokeWidth={1.5} />}
        />
        <Tab
          label={t("diagnostics.tabs.config")}
          value="config"
          icon={<Settings size={18} strokeWidth={1.5} />}
        />
        <Tab
          label={t("diagnostics.tabs.access")}
          value="access"
          icon={<Shield size={18} strokeWidth={1.5} />}
        />
      </Tabs>
      {tabValue === "logs" && <DiagnosticsLogTab />}
      {tabValue === "queue" && <DiagnosticsQueueTab />}
      {tabValue === "config" && <DiagnosticsConfigTab />}
      {tabValue === "access" && <DiagnosticsAccessTab />}
    </BasePage>
  );
};

export default DiagnosticPage;
