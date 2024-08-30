import { useTheme } from "@emotion/react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { formatDate } from "../../../Utils/timeUtils";
import { useEffect, useState } from "react";
import "./index.css";

const BarChart = ({ checks = [] }) => {
  const theme = useTheme();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  });

  // set responseTime to average if there's only one check
  if (checks.length === 1) {
    checks[0] = { ...checks[0], responseTime: 50 };
  }

  if (checks.length !== 25) {
    const placeholders = Array(25 - checks.length).fill("placeholder");
    checks = [...checks, ...placeholders];
  }

  return (
    <Stack
      direction="row"
      flexWrap="nowrap"
      gap={theme.spacing(1.5)}
      height="50px"
      width="fit-content"
      onClick={(event) => event.stopPropagation()}
      sx={{
        cursor: "default",
      }}
    >
      {checks.map((check, index) =>
        check === "placeholder" ? (
          <Box
            key={`${check}-${index}`}
            position="relative"
            width={theme.spacing(4.5)}
            height="100%"
            backgroundColor={theme.palette.background.fill}
            sx={{
              borderRadius: theme.spacing(1.5),
            }}
          />
        ) : (
          <Tooltip
            title={
              <>
                <Typography>
                  {formatDate(new Date(check.createdAt), { year: undefined })}
                </Typography>
                <Box mt={theme.spacing(2)}>
                  <Box
                    display="inline-block"
                    width={theme.spacing(4)}
                    height={theme.spacing(4)}
                    backgroundColor={
                      check.status
                        ? theme.palette.success.main
                        : theme.palette.error.text
                    }
                    sx={{ borderRadius: "50%" }}
                  />
                  <Stack
                    display="inline-flex"
                    direction="row"
                    justifyContent="space-between"
                    ml={theme.spacing(2)}
                    gap={theme.spacing(12)}
                  >
                    <Typography component="span" sx={{ opacity: 0.8 }}>
                      Response Time
                    </Typography>
                    <Typography component="span">
                      {check.originalResponseTime}
                      <Typography component="span" sx={{ opacity: 0.8 }}>
                        {" "}
                        ms
                      </Typography>
                    </Typography>
                  </Stack>
                </Box>
              </>
            }
            placement="top"
            key={`check-${check?._id}`}
            slotProps={{
              popper: {
                className: "bar-tooltip",
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, -10],
                    },
                  },
                ],
                sx: {
                  "& .MuiTooltip-tooltip": {
                    backgroundColor: theme.palette.background.main,
                    border: 1,
                    borderColor: theme.palette.border.dark,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: theme.shape.boxShadow,
                    px: theme.spacing(4),
                    py: theme.spacing(2),
                  },
                  "& .MuiTooltip-tooltip p": {
                    fontSize: 12,
                    color: theme.palette.text.tertiary,
                    fontWeight: 500,
                  },
                  "& .MuiTooltip-tooltip span": {
                    fontSize: 11,
                    color: theme.palette.text.tertiary,
                    fontWeight: 600,
                  },
                },
              },
            }}
          >
            <Box
              position="relative"
              width="9px"
              height="100%"
              backgroundColor={
                check.status ? theme.palette.success.bg : theme.palette.error.bg
              }
              sx={{
                borderRadius: theme.spacing(1.5),
                "&:hover > .MuiBox-root": {
                  filter: "brightness(0.8)",
                },
              }}
            >
              <Box
                position="absolute"
                bottom={0}
                width="100%"
                height={`${animate ? check.responseTime : 0}%`}
                backgroundColor={
                  check.status
                    ? theme.palette.success.main
                    : theme.palette.error.text
                }
                sx={{
                  borderRadius: theme.spacing(1.5),
                  transition: "height 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </Box>
          </Tooltip>
        )
      )}
    </Stack>
  );
};

export default BarChart;
