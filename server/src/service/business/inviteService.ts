import type { Invite, UserRole } from "@/types/index.js";
import { canManageRole } from "@/types/user.js";
import type { IInvitesRepository } from "@/repositories/index.js";
import { AppError } from "@/utils/AppError.js";
import { ISettingsService } from "../system/settingsService.js";
import { IEmailService } from "../infrastructure/emailService.js";

const SERVICE_NAME = "inviteService";

export interface IInviteService {
	getInviteToken(params: { invite: Partial<Invite>; teamId: string; userRoles: UserRole[] }): Promise<Invite>;
	sendInviteEmail(params: { invite: Partial<Invite>; firstName: string; userRoles: UserRole[] }): Promise<void>;
	verifyInviteToken(params: { inviteToken: string }): Promise<Invite>;
}

export class InviteService implements IInviteService {
	static SERVICE_NAME = SERVICE_NAME;

	private settingsService: ISettingsService;
	private emailService: IEmailService;
	private invitesRepository: IInvitesRepository;

	constructor({
		invitesRepository,
		settingsService,
		emailService,
	}: {
		invitesRepository: IInvitesRepository;
		settingsService: ISettingsService;
		emailService: IEmailService;
	}) {
		this.invitesRepository = invitesRepository;
		this.settingsService = settingsService;
		this.emailService = emailService;
	}

	get serviceName() {
		return InviteService.SERVICE_NAME;
	}

	getInviteToken = async ({ invite, teamId, userRoles }: { invite: Partial<Invite>; teamId: string; userRoles: UserRole[] }) => {
		invite.teamId = teamId;

		const inviteRoles = invite.role ?? [];

		for (const targetRole of inviteRoles) {
			const canManage = userRoles.some((actorRole) => canManageRole(actorRole, targetRole));
			if (!canManage) {
				throw new AppError({
					message: "You do not have permission to create this invite",
					service: SERVICE_NAME,
					method: "getInviteToken",
					status: 403,
				});
			}
		}

		const inviteToken = await this.invitesRepository.create(invite);
		return inviteToken;
	};

	sendInviteEmail = async ({ invite, firstName, userRoles }: { invite: Partial<Invite>; firstName: string; userRoles: UserRole[] }) => {
		const inviteRoles = invite.role ?? [];
		if (!invite.email) {
			throw new AppError({
				message: "Invite email is required to send an invite",
				service: SERVICE_NAME,
				method: "sendInviteEmail",
				status: 400,
			});
		}

		for (const targetRole of inviteRoles) {
			const canManage = userRoles.some((actorRole) => canManageRole(actorRole, targetRole));
			if (!canManage) {
				throw new AppError({
					message: "You do not have permission to create this invite",
					service: SERVICE_NAME,
					method: "sendInviteEmail",
					status: 403,
				});
			}
		}

		const inviteToken = await this.invitesRepository.create(invite);
		const { clientHost } = this.settingsService.getSettings();

		const html = await this.emailService.buildEmail("employeeActivationTemplate", {
			name: firstName,
			link: `${clientHost}/register/${inviteToken.token}`,
		});

		if (!html) {
			throw new AppError({
				message: "Failed to build invite e-mail... Please verify your settings.",
				service: SERVICE_NAME,
				method: "sendInviteEmail",
				status: 500,
			});
		}

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
