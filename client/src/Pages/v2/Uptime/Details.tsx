import { BasePage } from "@/Components/v2/DesignElements";
import { HeaderControls } from "@/Components/v2/Monitors/HeaderControls";

import { useParams } from "react-router";
import { useGet, usePatch, type ApiResponse } from "@/Hooks/v2/UseApi";
import { useState } from "react";
const UptimeDetailsPage = () => {
	const { id } = useParams();

	// Local state
	const [range, setRange] = useState("30m");

	const { response, loading, error, refetch } = useGet<ApiResponse>(
		`/monitors/${id}?range=${range}`
	);
	const {
		patch,
		loading: isPatching,
		error: postError,
	} = usePatch<ApiResponse>(`/monitors/${id}/active`);

	const monitor = response?.data || null;
	if (!monitor) {
		return null;
	}

	return (
		<BasePage>
			<HeaderControls
				monitor={monitor}
				patch={patch}
				isPatching={isPatching}
				refetch={refetch}
			/>
		</BasePage>
	);
};

export default UptimeDetailsPage;
