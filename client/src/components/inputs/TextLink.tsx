import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";

import { useTheme } from "@mui/material/styles";

export const TextLink = ({
  text,
  linkText,
  href,
  target = "_self",
}: {
  text: string;
  linkText: string;
  href: string;
  target?: string;
}) => {
  const theme = useTheme();

  return (
    <Stack direction="row" gap={theme.spacing(4)}>
      <Typography>{text}</Typography>
      <Link color="accent" to={href} component={RouterLink} target={target}>
        {linkText}
      </Link>
    </Stack>
  );
};
