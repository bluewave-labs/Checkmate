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
        // Le composant Checkbox personnalisé renvoie l'event natif
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
                    availableDisks.map((disk) => (
                        /* Reproduction exacte de la structure de CustomThreshold 
                           pour garantir l'alignement parfait avec la section Alertes 
                        */
                        <Stack
                            key={disk.mountpoint}
                            direction={{ sm: "column", md: "row" }}
                            spacing={theme.spacing(2)}
                        >
                            <Box
                                sx={{
                                    // Mêmes largeurs que dans CustomThreshold pour aligner les labels
                                    width: { md: "45%", lg: "25%", xl: "20%" },
                                }}
                                justifyContent="flex-start"
                            >
                                <Checkbox
                                    id={`disk-${disk.mountpoint}`}
                                    name={disk.mountpoint}
                                    label={disk.mountpoint}
                                    isChecked={selectedDisks.includes(disk.mountpoint)}
                                    onChange={(e) => handleDiskChange(e, disk.mountpoint)}
                                />
                            </Box>
                            {/* Pas de deuxième Stack ici car nous n'avons pas besoin 
                                du champ TextInput pour la sélection simple 
                            */}
                        </Stack>
                    ))
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