import type { Invite } from "@/types/index.js";
import type { IInvitesRepository } from "@/repositories/index.js";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "inviteService";

class InviteService {
	static SERVICE_NAME = SERVICE_NAME;

	private settingsService: any;
	private emailService: any;
	private invitesRepository: IInvitesRepository;

	constructor({
		invitesRepository,
		settingsService,
		emailService,
	}: {
		invitesRepository: IInvitesRepository;
		settingsService: any;
		emailService: any;
	}) {
		this.invitesRepository = invitesRepository;
		this.settingsService = settingsService;
		this.emailService = emailService;
	}

	get serviceName() {
		return InviteService.SERVICE_NAME;
	}

	getInviteToken = async ({ invite, teamId }: { invite: Partial<Invite>; teamId: string }) => {
		invite.teamId = teamId;
		const inviteToken = await this.invitesRepository.create(invite);
		return inviteToken;
	};

	sendInviteEmail = async ({ invite, firstName }: { invite: Partial<Invite>; firstName: any }) => {
		const inviteToken = await this.invitesRepository.create(invite);
		const { clientHost } = this.settingsService.getSettings();

		const html = await this.emailService.buildEmail("employeeActivationTemplate", {
			name: firstName,
			link: `${clientHost}/register/${inviteToken.token}`,
		});
		const result = await this.emailService.sendEmail(invite.email, "Welcome to Uptime Monitor", html);
		if (!result) {
			throw new AppError({
				message: "Failed to send invite e-mail... Please verify your settings.",
				service: SERVICE_NAME,
				method: "sendInviteEmail",
				status: 500,
			});
		}
	};

	verifyInviteToken = async ({ inviteToken }: { inviteToken: string }) => {
		return await this.invitesRepository.findByToken(inviteToken);
	};
}

export default InviteService;
