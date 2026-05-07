import { useTranslation } from "react-i18next";
import {
	formatStatusCode,
	getStatusCodeTooltip,
	getStatusCodeValueType,
} from "@/Utils/statusCode";
import { ValueLabel } from "./StatusLabel";
import { Tooltip } from "./Tooltip";

export type StatusCodeLabelProps = {
	statusCode: number | null | undefined;
	message?: string | null;
	fallback?: string;
};

export const StatusCodeLabel = ({
	statusCode,
	message,
	fallback = "N/A",
}: StatusCodeLabelProps) => {
	const { t } = useTranslation();
	if (!statusCode) {
		return <>{fallback}</>;
	}

	const text = formatStatusCode(statusCode, t);
	const tooltip = getStatusCodeTooltip(statusCode, message, t);
	const body = (
		<ValueLabel
			value={getStatusCodeValueType(statusCode)}
			text={text}
		/>
	);
	if (!tooltip) return body;
	return <Tooltip title={tooltip}>{body}</Tooltip>;
};
