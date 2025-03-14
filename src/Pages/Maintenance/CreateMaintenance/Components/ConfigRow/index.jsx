import { Box, Stack, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import ConfigBox from "../../../../../Components/ConfigBox";

const ConfigRow = ({ title, description, children }) => {
  const theme = useTheme();

  return (
    <ConfigBox>
      <Box>
        <Typography component="h2" variant="h2">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" mt={theme.spacing(2)}>
            {description}
          </Typography>
        )}
      </Box>
      <Stack gap={theme.spacing(15)} mt={theme.spacing(4)}>
        {children}
      </Stack>
    </ConfigBox>
  );
};

ConfigRow.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node
};

export default ConfigRow;