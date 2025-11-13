import Stack from "@mui/material/Stack";
import { Button } from "@/components/inputs";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
export const HeaderCreate = ({
  label,
  isLoading,
  path,
}: {
  label?: string;
  isLoading: boolean;
  path: string;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Stack
      direction="row"
      justifyContent="end"
      alignItems="center"
      gap={theme.spacing(6)}
    >
      <Button
        loading={isLoading}
        variant="contained"
        color="accent"
        onClick={() => navigate(path)}
      >
        {label || t("createNew")}
      </Button>
    </Stack>
  );
};
