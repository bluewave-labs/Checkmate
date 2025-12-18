import React from "react";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import { Box, Stack, Typography } from "@mui/material";
import Checkbox from "@/Components/v1/Inputs/Checkbox/index.jsx";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

const DiskSelection = ({ availableDisks, selectedDisks, onChange }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const handleDiskChange = (event, mountpoint) => {
        const isChecked = event.target.checked;
        let newSelectedDisks = [];

        if (isChecked) {
            newSelectedDisks = [...selectedDisks, mountpoint];
        } else {
            newSelectedDisks = selectedDisks.filter((disk) => disk !== mountpoint);
        }

        onChange(newSelectedDisks);
    };

    return (
        <ConfigBox>
            <Box>
                <Typography component="h2" variant="h2">
                    {t("v1.infrastructure.disk_selection_title")}
                </Typography>
                <Typography component="p">
                    {t("v1.infrastructure.disk_selection_description")}
                </Typography>
            </Box>

            <Stack gap={theme.spacing(6)}>
                {(!availableDisks || availableDisks.length === 0) ? (
                    <Typography
                        variant="body2"
                        sx={{ fontStyle: 'italic', opacity: 0.8 }}
                    >
                        {t("v1.infrastructure.disk_selection_info")}
                    </Typography>
                ) : (
                    availableDisks.map((disk) => {
                        const identifier = disk.mountpoint || disk.device;
                        return (
                            <Stack
                                key={identifier}
                                direction={{ sm: "column", md: "row" }}
                                spacing={theme.spacing(2)}
                            >
                                <Box
                                    sx={{
                                        width: "100%",
                                    }}
                                    justifyContent="flex-start"
                                >
                                    <Checkbox
                                        id={`disk-${identifier}`}
                                        name={identifier}
                                        label={identifier}
                                        isChecked={selectedDisks.includes(identifier)}
                                        onChange={(e) => handleDiskChange(e, identifier)}
                                    />
                                </Box>
                            </Stack>
                        )
                    })
                )}
            </Stack>
        </ConfigBox>
    );
};

DiskSelection.propTypes = {
    availableDisks: PropTypes.arrayOf(
        PropTypes.shape({
            mountpoint: PropTypes.string.isRequired,
        })
    ),
    selectedDisks: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func.isRequired,
};

export default DiskSelection;