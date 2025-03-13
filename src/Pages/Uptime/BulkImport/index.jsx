// React, Redux, Router
import { useTheme } from "@emotion/react";
import { useState } from "react";
// MUI
import { Box, Stack, Typography, Button, Link } from "@mui/material";

//Components
import { networkService } from "../../../main";
import { createToast } from "../../../Utils/toastUtils";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import ConfigBox from "../../../Components/ConfigBox";
import { Upload } from "./Upload";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Trans, useTranslation } from "react-i18next";

const BulkImport = () => {
	const theme = useTheme();

	const [monitors, setMonitors] = useState([]);
	const { user } = useSelector((state) => state.auth);
	const navigate = useNavigate();
	const { t } = useTranslation();

	const crumbs = [
		{ name: t("uptime.title"), path: "/uptime" },
		{ name: t("uptime.bulkImport.title"), path: `/uptime/bulk-import` },
	];

	const [isLoading, setIsLoading] = useState(false);
	const handleSubmit = async () => {
		setIsLoading(true);
		try {
			const monitorsWithUser = monitors.map((monitor) => ({
				...monitor,
				description: monitor.name || monitor.url,
				teamId: user.teamId,
				userId: user._id,
			}));
			await networkService.createBulkMonitors({ monitors: monitorsWithUser });
			createToast({ body: t("uptime.bulkImport.uploadSuccess") });
			navigate("/uptime");
		} catch (error) {
			createToast({ body: error?.response?.data?.msg ?? error.message });
		} finally {
			setIsLoading(false);
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
					{t("uptime.bulkImport.title")}
				</Typography>
				<ConfigBox>
					<Box>
						<Typography component="h2">
							{t("uptime.bulkImport.selectFileTips")}
						</Typography>
						<Typography component="p">
							<Trans
								i18nKey="uptime.bulkImport.selectFileDescription"
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
							<Upload onComplete={setMonitors} />
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
						disabled={!monitors?.length}
						loading={isLoading}
					>
						{t("submit")}
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
};

export default BulkImport;
