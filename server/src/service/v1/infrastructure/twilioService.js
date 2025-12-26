import twilio from "twilio";

const SERVICE_NAME = "TwilioService";

/**
 * Represents an SMS service that can send SMS messages.
 */
class TwilioService {
	static SERVICE_NAME = SERVICE_NAME;
	/**
	 * Constructs an instance of the TwilioService, initializing the Twilio client.
	 * @param {Object} settingsService - The settings service to get SMS configuration.
	 * @param {Object} logger - The logger module.
	 */
	constructor(settingsService, logger) {
		this.settingsService = settingsService;
		this.logger = logger;

		/**
		 * The Twilio client used to send SMS messages.
		 * @type {Object}
		 */
		this.client = null;

		this.init();
	}

	init = async () => {
		const config = await this.settingsService.getDBSettings();
		const { twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = config;

		if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
			this.logger.error({
				message: "Twilio SMS notifications are disabled because the Twilio credentials are not set",
				service: SERVICE_NAME,
			});
		} else {
			this.client = twilio(twilioAccountSid, twilioAuthToken);
		}
	};

	/**
	 * Asynchronously builds and sends an SMS using a specified message and recipient phone number.
	 *
	 * @param {string} to - The recipient's phone number.
	 * @param {string} text - The message to send.
	 * @returns {Promise<boolean>} A promise that resolves to true if the SMS is sent successfully, false otherwise.
	 */
	sendSms = async (to, text) => {
		if (!this.client) {
			await this.init();
		}
		if (!this.client) {
			return false;
		}
		const { twilioPhoneNumber } = await this.settingsService.getDBSettings();

		this.logger.info({
			message: `Sending Twilio SMS to ${to}: ${text}`,
			service: SERVICE_NAME,
		});
		try {
			const message = await this.client.messages.create({
				body: text,
				to: to,
				from: twilioPhoneNumber,
			});
			this.logger.info({
				message: `Twilio SMS sent: ${message.sid}`,
				service: SERVICE_NAME,
			});
			return true;
		} catch (error) {
			this.logger.error({
				message: `Error sending Twilio SMS: ${error.message}`,
				service: SERVICE_NAME,
			});
			return false;
		}
	};
}
export default TwilioService;
