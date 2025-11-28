import { BasePage, ConfigBox } from "@/components/design-elements/index.js";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { Button } from "@/components/inputs";
import { Typography } from "@mui/material";
import { useGetOnDemand, usePost } from "@/hooks/UseApi";
import { useTheme } from "@mui/material/styles";
import { useRef } from "react";

const ExportPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const theme = useTheme();

  const { get, loading } = useGetOnDemand();
  const { post, loading: isPosting } = usePost();

  const handleExport = async () => {
    const res = await get("/monitors/export");
    if (!res?.data) {
      return;
    }

    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "monitors.json";
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

  return (
    <BasePage>
      <ConfigBox
        title="Export current team's monitors"
        subtitle="This will only export the basic monitor settings, not the check history, incidents history, or notifications"
        rightContent={
          <Stack gap={theme.spacing(4)}>
            <Typography>Click here to export your monitors to JSON</Typography>
            <Box>
              <Button
                loading={loading}
                variant="contained"
                color="accent"
                onClick={handleExport}
              >
                Export to JSON
              </Button>
            </Box>
          </Stack>
        }
      />
      <ConfigBox
        title="Import monitors"
        subtitle="Import monitors from a JSON file. Sample:"
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
              Click here to import your monitors from JSON
            </Typography>
            <Box>
              <Button
                loading={isPosting}
                variant="contained"
                color="accent"
                onClick={handleImport}
              >
                Import from JSON
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
    </BasePage>
  );
};

export default ExportPage;
