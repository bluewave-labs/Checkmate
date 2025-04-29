// React, Redux, Router
import { useTheme } from "@emotion/react";
import { useState } from "react";
// MUI
import { Box, Stack, Typography, Button, Link } from "@mui/material";

//Components
import { createToast } from "../../../Utils/toastUtils";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import ConfigBox from "../../../Components/ConfigBox";
import UploadFile from "./Upload";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import { useBulkMonitors } from "../../../Hooks/useBulkMonitors";

const BulkImport = () => {
	const theme = useTheme();
	const { user } = useSelector((state) => state.auth);
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [selectedFile, setSelectedFile] = useState(null);

	const crumbs = [
		{ name: t("uptime"), path: "/uptime" },
		{ name: t("bulkImport.title"), path: `/uptime/bulk-import` },
	];

	const { createBulkMonitors, isLoading: hookLoading, error } = useBulkMonitors();

	const handleSubmit = async () => {
		if (!selectedFile) {
			createToast({ body: t("bulkImport.noFileSelected") });
			return;
		}
		const success = await createBulkMonitors(selectedFile, user);

		if (success) {
			createToast({ body: t("bulkImport.uploadSuccess") });
			navigate("/uptime");
		} else {
			createToast({ body: error });
		}
	};

	return (
		<Box className="bulk-import-monitor">
			<Breadcrumbs list={crumbs} />
			<Stack
				component="form"
				gap={theme.spacing(12)}
				mt={theme.spacing(6)}
			>
				<Typography
					component="h1"
					variant="h1"
				>
					{t("bulkImport.title")}
				</Typography>
				<ConfigBox>
					<Box>
						<Typography component="h2">{t("bulkImport.selectFileTips")}</Typography>
						<Typography component="p">
							<Trans
								i18nKey="bulkImport.selectFileDescription"
								components={{
									template: (
										<Link
											color="info"
											download
											href="bulk_import_monitors_template.csv"
										/>
									),
									sample: (
										<Link
											color="info"
											download
											href="bulk_import_monitors_sample.csv"
										/>
									),
								}}
							/>
						</Typography>
					</Box>
					<Stack gap={theme.spacing(12)}>
						<Stack gap={theme.spacing(6)}>
							<UploadFile onFileSelect={(file) => setSelectedFile(file)} />
						</Stack>
					</Stack>
				</ConfigBox>
				<Stack
					direction="row"
					justifyContent="flex-end"
				>
					<Button
						variant="contained"
						color="accent"
						onClick={handleSubmit}
						disabled={hookLoading}
						loading={hookLoading}
					>
						{t("submit")}
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
};

export default BulkImport;
