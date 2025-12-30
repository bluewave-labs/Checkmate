import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { BaseBox } from "@/components/design-elements";

type ExposedPort = { port: string; protocol: string };

export type DockerContainerSummary = {
  container_id: string;
  container_name: string;
  base_image?: string;
  exposed_ports?: ExposedPort[];
  status?: string;
  health?: { healthy?: boolean; source?: string; message?: string };
};

const shortId = (id?: string) => (id ? id.slice(0, 12) : "-");
const portsText = (ports?: ExposedPort[]) =>
  (ports || [])
    .map((p) => `${p.port}${p.protocol ? "/" + p.protocol : ""}`)
    .join(", ");

export const CardDockerContainer = ({
  container,
}: {
  container: DockerContainerSummary;
}) => {
  const { t } = useTranslation();
  return (
    <BaseBox p={4} width={{ xs: "100%", md: 420 }}>
      <Stack spacing={6} sx={{ width: "100%" }}>
        <Typography variant="h6" color="textPrimary">
          {t("monitors.docker.details.dockerContainerCard.title", {
            name: container.container_name || "-",
          })}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={4}>
            <Typography variant="body2" color="text.secondary">
              {t("monitors.docker.details.dockerContainerCard.fields.status")}
            </Typography>
          </Grid>
          <Grid size={8}>
            <Typography variant="body2">{container.status || "-"}</Typography>
          </Grid>

          <Grid size={4}>
            <Typography variant="body2" color="text.secondary">
              {t("monitors.docker.details.dockerContainerCard.fields.health")}
            </Typography>
          </Grid>
          <Grid size={8}>
            <Typography variant="body2">
              {container.health?.healthy === true
                ? t(
                    "monitors.docker.details.dockerContainerCard.values.healthy"
                  )
                : container.health?.healthy === false
                  ? t(
                      "monitors.docker.details.dockerContainerCard.values.unhealthy"
                    )
                  : "-"}
            </Typography>
          </Grid>

          <Grid size={4}>
            <Typography variant="body2" color="text.secondary">
              {t("monitors.docker.details.dockerContainerCard.fields.id")}
            </Typography>
          </Grid>
          <Grid size={8}>
            <Typography variant="body2">
              {shortId(container.container_id)}
            </Typography>
          </Grid>

          <Grid size={4}>
            <Typography variant="body2" color="text.secondary">
              {t("monitors.docker.details.dockerContainerCard.fields.image")}
            </Typography>
          </Grid>
          <Grid size={8}>
            <Typography variant="body2">
              {container.base_image || "-"}
            </Typography>
          </Grid>

          <Grid size={4}>
            <Typography variant="body2" color="text.secondary">
              {t("monitors.docker.details.dockerContainerCard.fields.ports")}
            </Typography>
          </Grid>
          <Grid size={8}>
            <Typography variant="body2">
              {portsText(container.exposed_ports)}
            </Typography>
          </Grid>
        </Grid>
      </Stack>
    </BaseBox>
  );
};
