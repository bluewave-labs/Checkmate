import PropTypes from "prop-types";
import StatusBoxes from "../../../../../Components/StatusBoxes";
import StatBox from "../../../../../Components/StatBox";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useHardwareUtils } from "../../Hooks/useHardwareUtils";

function formatNumber(num) {
	return num != null ? num.toLocaleString() : "0";
}

const NetworkStatBoxes = ({ shouldRender, net, ifaceName }) => {
	const { t } = useTranslation();
	const { formatBytes } = useHardwareUtils();

	const filtered = net?.filter((iface) => iface.name === ifaceName) || [];

	if (!net?.length) {
		return <Typography>{t("noNetworkStatsAvailable")}</Typography>;
	}

	return (
		<StatusBoxes
			shouldRender={shouldRender}
			flexWrap="wrap"
		>
			{filtered
				.map((iface) => [
					<StatBox
						key={`${iface.name}-bytes-sent`}
						heading={t("bytesSent")}
						subHeading={formatBytes(iface.bytes_sent)}
					/>,
					<StatBox
						key={`${iface.name}-bytes-recv`}
						heading={t("bytesReceived")}
						subHeading={formatBytes(iface.bytes_recv)}
					/>,
					<StatBox
						key={`${iface.name}-packets-sent`}
						heading={t("packetsSent")}
						subHeading={formatNumber(iface.packets_sent)}
					/>,
					<StatBox
						key={`${iface.name}-packets-recv`}
						heading={t("packetsReceived")}
						subHeading={formatNumber(iface.packets_recv)}
					/>,
					<StatBox
						key={`${iface.name}-err-in`}
						heading={t("errorsIn")}
						subHeading={formatNumber(iface.err_in)}
					/>,
					<StatBox
						key={`${iface.name}-err-out`}
						heading={t("errorsOut")}
						subHeading={formatNumber(iface.err_out)}
					/>,
				])
				.flat()}
		</StatusBoxes>
	);
};

NetworkStatBoxes.propTypes = {
	shouldRender: PropTypes.bool.isRequired,
	net: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			bytes_sent: PropTypes.number,
			bytes_recv: PropTypes.number,
			packets_sent: PropTypes.number,
			packets_recv: PropTypes.number,
			err_in: PropTypes.number,
			err_out: PropTypes.number,
		})
	),
	ifaceName: PropTypes.string.isRequired,
};

export default NetworkStatBoxes;
