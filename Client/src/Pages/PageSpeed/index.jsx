import { Box, Grid, Stack, Typography } from "@mui/material";
import Fallback from "../../Components/Fallback";
import { useTheme } from "@emotion/react";
import PageSpeedIcon from "../../assets/icons/page-speed.svg?react";

import "./index.css";

const Card = ({ data }) => {
  const theme = useTheme();
  return (
    <Grid item lg={6} flexGrow={1}>
      <Stack direction="row" gap={theme.gap.medium} p={theme.gap.ml}>
        <PageSpeedIcon style={{ width: theme.gap.ml, height: theme.gap.ml }} />
        <Box>
          <Stack direction="row" justifyContent="space-between">
            <Typography component="h2" mb={theme.gap.xs}>
              {data.name}
            </Typography>
            {/* TODO - Add status label */}
          </Stack>
          <Typography>{data.url}</Typography>
          <Typography mt={theme.gap.large}>
            <Typography component="span" fontWeight={600}>
              Last checked:{" "}
            </Typography>
            {/* get last check */}
            <Typography component="span" fontStyle="italic">
              (3 minutes ago)
            </Typography>
          </Typography>
        </Box>
      </Stack>
    </Grid>
  );
};

const PageSpeed = () => {
  const theme = useTheme();

  // sample data, remove later
  let monitors = [
    {
      success: true,
      msg: 'Got monitor for 66a3d58ecd42ab3ed1171cf1 successfully"',
      data: [
        {
          _id: "66a3ef558943628c59aabf00",
          userId: "66a3d58ecd42ab3ed1171cf1",
          name: "Google",
          description: "Google",
          status: true,
          type: "pagespeed",
          url: "https://www.google.com",
          isActive: true,
          interval: 10000,
          createdAt: "2024-07-26T18:47:49.212Z",
          updatedAt: "2024-07-26T18:47:49.212Z",
          __v: 0,
          checks: [
            {
              _id: "66a3f2266a073a2ff8dd0f7f",
              monitorId: "66a3ef558943628c59aabf00",
              status: true,
              accessibility: 90,
              bestPractices: 93,
              seo: 92,
              performance: 93,
              createdAt: "2024-07-26T18:59:50.103Z",
              updatedAt: "2024-07-26T18:59:50.103Z",
              __v: 0,
            },
            {
              _id: "66a3f2226a073a2ff8dd0f7d",
              monitorId: "66a3ef558943628c59aabf00",
              status: true,
              accessibility: 90,
              bestPractices: 93,
              seo: 92,
              performance: 87,
              createdAt: "2024-07-26T18:59:46.280Z",
              updatedAt: "2024-07-26T18:59:46.280Z",
              __v: 0,
            },
          ],
        },
      ],
    },
  ];

  return (
    <Box className="page-speed">
      {monitors ? (
        <Stack gap={theme.gap.small}>
          <Typography component="h1">All page speed monitors</Typography>
          <Typography mb={theme.gap.large}>
            Click on one of the monitors to get more site speed information.
          </Typography>
          <Grid container spacing={theme.gap.large}>
            {monitors[0].data?.map((monitor) => (
              <Card data={monitor} key={`monitor-${monitor._id}`} />
            ))}
          </Grid>
        </Stack>
      ) : (
        <Fallback
          title="page speed"
          checks={[
            "Report on the user experience of a page",
            "Help analyze webpage speed",
            "Give suggestions on how the page can be improved",
          ]}
          link="/page-speed/create"
        />
      )}
    </Box>
  );
};

export default PageSpeed;
