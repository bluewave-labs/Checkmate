import { BasePage, Tab, Tabs, InfoBox } from "@/components/design-elements";
import { DiagnosticsLogTab } from "@/pages/diagnostic/DiagnosticsLogTab";
import { DiagnosticsQueueTab } from "@/pages/diagnostic/DiagnosticsQueueTab";
import { FileText, ListTodo } from "lucide-react";
import { useState } from "react";

const DiagnosticPage = () => {
  const [tabValue, setTabValue] = useState("logs");

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <BasePage>
      <InfoBox
        title="System Diagnostics"
        description="Review system logs and background job status to troubleshoot issues. Monitor the health of your monitoring infrastructure and investigate any problems."
      />
      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab
          label="Logs"
          value="logs"
          icon={<FileText size={18} strokeWidth={1.5} />}
        />
        <Tab
          label="Jobs"
          value="jobs"
          icon={<ListTodo size={18} strokeWidth={1.5} />}
        />
      </Tabs>
      {tabValue === "logs" && <DiagnosticsLogTab />}
      {tabValue === "jobs" && <DiagnosticsQueueTab />}
    </BasePage>
  );
};

export default DiagnosticPage;
