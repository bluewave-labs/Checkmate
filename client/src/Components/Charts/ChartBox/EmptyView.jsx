// Components
import { Typography, Stack } from "@mui/material";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import IconBox from "../../IconBox";

/**
 * `EmptyView` is a functional React component that displays an empty state view with an optional icon, header, and message.
 *
 * @component
 * @param {Object} props - The properties that define the `EmptyView` component.
 * @param {React.ReactNode} [props.icon] - An optional icon to display at the top of the empty view.
 * @param {string} [props.header] - An optional header text displayed next to the icon.
 * @param {string} [props.message="No Data"] - The message to be displayed in the empty view.
 * @param {'h1' | 'h2' | 'h3'} [props.headingLevel="h2"] - The heading level for the message text.
 * @param {string} [props.justifyContent="flex-start"] - The CSS `justify-content` value to align elements vertically.
 * @param {string} [props.height="100%"] - The height of the empty view container.
 *
 * @example
 * // Example usage of EmptyView component:
 * <EmptyView
 *   icon={<SomeIcon />}
 *   header="Average Response Time"
 *   message="No Response Time Available"
 *   headingLevel="h2"
 *   justifyContent="center"
 *   height="50%"
 * />
 *
 * @returns {React.Element} The `EmptyView` component with customizable icon, header, and message.
 */

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
    headingLevel: PropTypes.oneOf(['h1', 'h2', 'h3']),
    justifyContent: PropTypes.string,
    height: PropTypes.string
};

export default EmptyView;
