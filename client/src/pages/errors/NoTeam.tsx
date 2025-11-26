import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseBox } from "@/components/design-elements";
import { Button } from "@/components/inputs";

import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router";
import { useAppDispatch } from "@/hooks/AppHooks";
import { usePost } from "@/hooks/UseApi";
import { logout } from "@/features/authSlice";

const NoTeam = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const { post } = usePost();

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      minHeight="70vh"
      paddingX={theme.spacing(8)}
      paddingY={theme.spacing(6)}
    >
      <BaseBox
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(2),
          maxWidth: 560,
          width: "100%",
          padding: theme.spacing(8),
          margin: theme.spacing(2),
        }}
      >
        <Typography variant="h1">You don't belong to a team yet</Typography>
        <Typography color="text.secondary">
          Please contact your administrator to be added to a team.
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="accent"
            onClick={async () => {
              await post("/auth/logout", {});
              navigate("/login");
              dispatch(logout());
            }}
          >
            Logout
          </Button>
        </Box>
      </BaseBox>
    </Stack>
  );
};

export default NoTeam;
