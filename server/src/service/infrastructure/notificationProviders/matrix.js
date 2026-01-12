const SERVICE_NAME = "Matrix";

class Matrix {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ networkService, logger }) {
		this.networkService = networkService;
		this.logger = logger;
	}

	get serviceName() {
		return Matrix.SERVICE_NAME;
	}

	async send({ friendlyName, homeserverUrl, accessToken, roomId, message, monitorName }) {
		const title = `Checkmate status for ${monitorName}`;
		const formattedMessage = `## ${title}\n${message}`;
		try {
			await this.networkService.requestMatrix({
				homeserverUrl,
				accessToken,
				roomId,
				message: formattedMessage,
			});
			this.logger.info(`Successfully sent Matrix notification for ${friendlyName}`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to send Matrix notification for ${friendlyName}: ${error.message}`);
			return false;
		}
	}
}

export default Matrix;
