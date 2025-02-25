// Components
import { Typography, Stack } from "@mui/material";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import IconBox from "../../IconBox";

const EmptyView = ({
    icon,
    header,
    message = "No Data",
    headingLevel = "h2",
    justifyContent = "flex-start",
    height = "100%"
}) => {
    const theme = useTheme();
    return (
        <Stack
            flex={1}
            direction="row"
            sx={{
                backgroundColor: theme.palette.primary.main,

                border: 1,
                borderStyle: "solid",
                borderColor: theme.palette.primary.lowContrast,
                borderRadius: 2,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
            }}
        >
            <Stack
                flex={1}
                alignItems="center"
                sx={{
                    padding: theme.spacing(8),
                    justifyContent,
                    gap: theme.spacing(8),
                    height,
                    "& h2": {
                        color: theme.palette.primary.contrastTextSecondary,
                        fontSize: 15,
                        fontWeight: 500,
                    },

                    "& tspan, & text": {
                        fill: theme.palette.primary.contrastTextTertiary,
                    },
                }}
            >
                <Stack
                    alignSelf="flex-start"
                    direction="row"
                    alignItems="center"
                    gap={theme.spacing(6)}
                >
                    {icon && <IconBox>{icon}</IconBox>}
                    {header && <Typography component="h2">{header}</Typography>}
                </Stack>
                <Stack
                    flex={1}
                    justifyContent="center"
                    alignItems="center"               
                >
                    <Typography component={headingLevel}>
                        {message}
                    </Typography>
                </Stack>
            </Stack>
        </Stack>
    );
};

EmptyView.propTypes = {
    message: PropTypes.string,
    icon: PropTypes.node,
    header: PropTypes.string,
    headingLevel: PropTypes.oneOf(['h1', 'h2', 'h3'])
};

export default EmptyView;