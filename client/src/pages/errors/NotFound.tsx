import PropTypes from "prop-types";
import NotFoundSvg from "@/assets/images/sushi_404.svg";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@/components/inputs";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const DefaultValue = {
  title: "Oh no! You dropped your sushi!",
  desc: "Either the URL doesn't exist, or you don't have access to it.",
};

const NotFound = ({ title = DefaultValue.title, desc = DefaultValue.desc }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack height="100vh" justifyContent="center">
      <Stack gap={theme.spacing(2)} alignItems="center">
        <img src={NotFoundSvg} alt="404" style={{ maxHeight: "25rem" }} />
        <Typography component="h1" variant="h1" fontSize={16}>
          {title}
        </Typography>
        <Typography variant="body1">{desc}</Typography>
        <Button
          variant="contained"
          color="accent"
          sx={{ mt: theme.spacing(10) }}
          onClick={() => navigate("/")}
        >
          {t("notFoundButton")}
        </Button>
      </Stack>
    </Stack>
  );
};

NotFound.propTypes = {
  title: PropTypes.string,
  desc: PropTypes.string,
};

export default NotFound;
