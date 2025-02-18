import { logger } from "../../../../Utils/Logger";
import { useEffect, useState } from "react";
import { networkService } from "../../../../main";
import { formatDateWithTz } from "../../../../Utils/timeUtils";

const useCertificateFetch = ({
	monitor,
	authToken,
	monitorId,
	certificateDateFormat,
	uiTimezone,
}) => {
	const [certificateExpiry, setCertificateExpiry] = useState(undefined);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const fetchCertificate = async () => {
			if (monitor?.type !== "http") {
				return;
			}

			try {
				setIsLoading(true);
				const res = await networkService.getCertificateExpiry({
					authToken: authToken,
					monitorId: monitorId,
				});
				if (res?.data?.data?.certificateDate) {
					const date = res.data.data.certificateDate;
					setCertificateExpiry(
						formatDateWithTz(date, certificateDateFormat, uiTimezone) ?? "N/A"
					);
				}
			} catch (error) {
				setCertificateExpiry("N/A");
				logger.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchCertificate();
	}, [authToken, monitorId, certificateDateFormat, uiTimezone, monitor]);
	return [certificateExpiry, isLoading];
};

export default useCertificateFetch;
