import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/components/design-elements";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
export interface ResolutionCardProps {
  resolved: boolean;
  type?: string;
  by?: string;
  note?: string;
  timestampLabel: string; // preformatted timestamp label
  durationLabel?: string; // optional preformatted duration
}

export const ResolutionCard = ({
  resolved,
  type,
  by,
  note,
  timestampLabel,
  durationLabel,
}: ResolutionCardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const bg = resolved ? theme.palette.success.light : theme.palette.error.light;

  return (
    <BaseBox sx={{ width: "100%", maxWidth: 420 }}>
      <Box
        sx={{
          bgcolor: bg,
          p: 6,
          borderTopLeftRadius: theme.shape.borderRadius,
          borderTopRightRadius: theme.shape.borderRadius,
        }}
      >
        <Typography variant="h6" color="textPrimary">
          {t("incidents.details.resolutionCard.title")}
        </Typography>
      </Box>
      <Stack spacing={3} padding={6}>
        <Typography variant="body2" color="textPrimary">
          {t("incidents.details.resolutionCard.resolutionStatus")}:{" "}
          <span style={{ color: bg }}>
            {resolved ? "resolved" : "unresolved"}
          </span>
        </Typography>
        {resolved && (
          <>
            <Typography variant="body2" color="textPrimary">
              {t("incidents.details.resolutionCard.resolutionType")}:{" "}
              {type || "N/A"}
            </Typography>
            <Typography variant="body2" color="textPrimary">
              {t("incidents.details.resolutionCard.resolvedBy")}: {by || "N/A"}
            </Typography>
          </>
        )}
        <Typography variant="body2" color="textPrimary">
          {timestampLabel}
        </Typography>
        {durationLabel && (
          <Typography variant="body2" color="textSecondary">
            {durationLabel}
          </Typography>
        )}
        <Typography variant="body2" color="textSecondary">
          {t("incidents.details.resolutionCard.note")}: {note || "N/A"}
        </Typography>
      </Stack>
    </BaseBox>
  );
};

export default ResolutionCard;
