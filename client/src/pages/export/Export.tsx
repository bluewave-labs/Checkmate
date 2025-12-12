import { BasePage, ConfigBox } from "@/components/design-elements/index.js";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { Button } from "@/components/inputs";
import { Typography } from "@mui/material";
import { useGetOnDemand, usePost } from "@/hooks/UseApi";
import { useTheme } from "@mui/material/styles";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
const ExportPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const theme = useTheme();
  const { t } = useTranslation();

  const { get, loading } = useGetOnDemand();
  const { post, loading: isPosting } = usePost();

  const exportJson = async (endpoint: string, filename: string) => {
    const res = await get(endpoint);
    const data = (res as any)?.data ?? (res as any);
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!fileInputRef.current) {
      return;
    }

    const input = fileInputRef.current;

    const handleFileChange = async () => {
      if (!input.files || input.files.length === 0) {
        return;
      }

      const file = input.files[0];
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        await post("/monitors/import", { monitors: json });
      } catch (error) {
        console.error("Failed to parse JSON", error);
      } finally {
        input.value = "";
        input.removeEventListener("change", handleFileChange);
      }
    };

    input.addEventListener("change", handleFileChange);
    input.click();
  };

  // Removed wrapper handlers; call exportJson directly from onClick

  return (
    <BasePage>
      <ConfigBox
        title={t("export.form.exportMonitors.title")}
        subtitle={t("export.form.exportMonitors.description")}
        rightContent={
          <Stack gap={theme.spacing(4)}>
            <Typography>
              {t("export.form.exportMonitors.optionExport")}
            </Typography>
            <Box>
              <Button
                loading={loading}
                variant="contained"
                color="primary"
                onClick={() => exportJson("/monitors/export", "monitors")}
              >
                {t("common.buttons.exportJson")}
              </Button>
            </Box>
          </Stack>
        }
      />
      <ConfigBox
        title={t("export.form.importMonitors.title")}
        subtitle={t("export.form.importMonitors.description")}
        leftContent={
          <Box
            component={"pre"}
            sx={{
              fontFamily: "monospace",
              p: 2,
              borderRadius: 1,
              overflow: "auto",
            }}
          >
            <code>
              {JSON.stringify(
                [
                  {
                    name: "Metrics",
                    url: "http://localhost:59232/api/v1/metrics",
                    type: "infrastructure",
                    interval: 60000,
                    n: 3,
                  },
                  {
                    name: "Yahoo",
                    url: "https://www.yahoo.com",
                    type: "pagespeed",
                    interval: 180000,
                    n: 3,
                  },
                ],
                null,
                2
              )}
            </code>
          </Box>
        }
        rightContent={
          <Stack gap={theme.spacing(4)}>
            <Typography>
              {t("export.form.importMonitors.optionImport")}
            </Typography>
            <Box>
              <Button
                loading={isPosting}
                variant="contained"
                color="primary"
                onClick={handleImport}
              >
                {t("common.buttons.importJson")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                style={{ display: "none" }}
              />
            </Box>
          </Stack>
        }
      />

      <ConfigBox
        title={t("export.form.exportIncidents.title")}
        subtitle={t("export.form.exportIncidents.description")}
        rightContent={
          <Stack gap={theme.spacing(4)}>
            <Typography>
              {t("export.form.exportIncidents.optionExport")}
            </Typography>
            <Box>
              <Button
                loading={loading}
                variant="contained"
                color="primary"
                onClick={() => exportJson("/incidents/export", "incidents")}
              >
                {t("common.buttons.exportJson")}
              </Button>
            </Box>
          </Stack>
        }
      />
    </BasePage>
  );
};

export default ExportPage;
