const SERVICE_NAME = "inviteService";

class InviteService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ db, settingsService, emailService, stringService, errorService }) {
		this.db = db;
		this.settingsService = settingsService;
		this.emailService = emailService;
		this.stringService = stringService;
		this.errorService = errorService;
	}

	get serviceName() {
		return InviteService.SERVICE_NAME;
	}

	getInviteToken = async ({ invite, teamId }) => {
		invite.teamId = teamId;
		const inviteToken = await this.db.requestInviteToken(invite);
		return inviteToken;
	};

	sendInviteEmail = async ({ inviteRequest, firstName }) => {
		const inviteToken = await this.db.requestInviteToken({ ...inviteRequest });
		const { clientHost } = this.settingsService.getSettings();

		const html = await this.emailService.buildEmail("employeeActivationTemplate", {
			name: firstName,
			link: `${clientHost}/register/${inviteToken.token}`,
		});
		const result = await this.emailService.sendEmail(inviteRequest.email, "Welcome to Uptime Monitor", html);
		if (!result) {
			throw this.errorService.createServerError("Failed to send invite e-mail... Please verify your settings.");
		}
	};

	verifyInviteToken = async ({ inviteToken }) => {
		const invite = await this.db.getInviteToken(inviteToken);
		return invite;
	};
}

export default InviteService;
