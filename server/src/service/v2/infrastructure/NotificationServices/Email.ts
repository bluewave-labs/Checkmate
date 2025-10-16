import { IMonitor, INotificationChannel } from "../../../../db/v2/models/index.js";
import { IMessageService, IAlert } from "./IMessageService.js";
import nodemailer, { Transporter } from "nodemailer";
import { config } from "../../../../config/index.js";
import UserService from "../../business/UserService.js";
import ApiError from "../../../../utils/ApiError.js";

const SERVICE_NAME = "EmailServiceV2";
class EmailService implements IMessageService {
	static SERVICE_NAME = SERVICE_NAME;
	private transporter: Transporter;
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
		this.transporter = nodemailer.createTransport({
			host: config.SMTP_HOST,
			port: config.SMTP_PORT,
			secure: config.SMTP_PORT === 465,
			auth: {
				user: config.SMTP_USER,
				pass: config.SMTP_PASS,
			},
		});
	}

	buildAlert = (monitor: IMonitor) => {
		const name = monitor?.name || "Unnamed monitor";
		const monitorStatus = monitor?.status || "unknown status";
		const url = monitor?.url || "no URL";
		const checkTime = monitor?.lastCheckedAt || null;
		const alertTime = new Date();
		return {
			name,
			url,
			status: monitorStatus,
			checkTime,
			alertTime,
		};
	};

	sendMessage = async (alert: string | IAlert, channel: INotificationChannel) => {
		try {
			const users = await this.userService.getAllUsers();
			const emails = users.map((u) => u.email).join(",");

			if (!emails || emails.length === 0) {
				throw new ApiError("No user emails found", 500);
			}

			await this.transporter.sendMail({
				from: `"Checkmate" <${config.SMTP_USER}>`,
				to: emails,
				subject: "Monitor Alert",
				text: JSON.stringify(alert, null, 2),
			});
			return true;
		} catch (error) {
			return false;
		}
	};

	testMessage = async () => {
		return true;
	};
}

export default EmailService;
