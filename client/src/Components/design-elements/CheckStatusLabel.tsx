import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { StatusLabel } from "@/Components/design-elements/StatusLabel";
import { EgressDegradedLabel } from "@/Components/design-elements/EgressDegradedLabel";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { Check } from "@/Types/Check";

// Status cell for the check tables: up/down, plus a note when the check was taken while egress was down.
export const CheckStatusLabel = ({
	check,
}: {
	check: Pick<Check, "status" | "egressStatus">;
}) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			alignItems="center"
			gap={theme.spacing(LAYOUT.XS)}
		>
			<StatusLabel status={check.status === true ? "up" : "down"} />
			<EgressDegradedLabel check={check} />
		</Stack>
	);
};
