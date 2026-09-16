import type { Invite, InviteSummary } from "@/domain/invites/invite.type.js";
import type { UserRole } from "@/domain/users/user.type.js";
import { canManageRole } from "@/domain/users/user.type.js";
import type { IInvitesRepository } from "@/domain/invites/invite.repository.interface.js";
import { HOUR_IN_MS } from "@/domain/invites/invite.constants.js";
import { AppError } from "@/utils/AppError.js";
import { ISettingsService } from "../app-settings/app-settings.service.js";
import { IEmailService } from "@/service/emailService.js";

const SERVICE_NAME = "inviteService";

export interface IInviteService {
	getInviteToken(params: { invite: Partial<Invite>; teamId: string; userRoles: UserRole[]; expiresInHours?: number }): Promise<Invite>;
	sendInviteEmail(params: { invite: Partial<Invite>; firstName: string; userRoles: UserRole[]; expiresInHours?: number }): Promise<void>;
	verifyInviteToken(params: { inviteToken: string }): Promise<Invite>;
	getInvites(params: { teamId: string }): Promise<InviteSummary[]>;
	updateInviteExpiry(params: { id: string; teamId: string; expiresInHours: number; userRoles: UserRole[] }): Promise<InviteSummary>;
	deleteInvite(params: { id: string; teamId: string; userRoles: UserRole[] }): Promise<void>;
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

	getInviteToken = async ({
		invite,
		teamId,
		userRoles,
		expiresInHours,
	}: {
		invite: Partial<Invite>;
		teamId: string;
		userRoles: UserRole[];
		expiresInHours?: number;
	}) => {
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

		const inviteToken = await this.invitesRepository.create(invite, expiresInHours);
		return inviteToken;
	};

	sendInviteEmail = async ({
		invite,
		firstName,
		userRoles,
		expiresInHours,
	}: {
		invite: Partial<Invite>;
		firstName: string;
		userRoles: UserRole[];
		expiresInHours?: number;
	}) => {
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

		const inviteToken = await this.invitesRepository.create(invite, expiresInHours);
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

		try {
			await this.emailService.sendEmail(invite.email, "Welcome to Uptime Monitor", html);
		} catch (error: unknown) {
			throw new AppError({
				message: "Failed to send invite e-mail... Please verify your settings.",
				service: SERVICE_NAME,
				method: "sendInviteEmail",
				status: 500,
				details: { cause: error instanceof Error ? error.message : "Unknown error" },
			});
		}
	};

	verifyInviteToken = async ({ inviteToken }: { inviteToken: string }) => {
		return await this.invitesRepository.findByToken(inviteToken);
	};

	getInvites = async ({ teamId }: { teamId: string }): Promise<InviteSummary[]> => {
		const invites = await this.invitesRepository.findByTeamId(teamId);
		return invites.map(stripToken);
	};

	updateInviteExpiry = async ({
		id,
		teamId,
		expiresInHours,
		userRoles,
	}: {
		id: string;
		teamId: string;
		expiresInHours: number;
		userRoles: UserRole[];
	}) => {
		const invite = await this.invitesRepository.findById({ id, teamId });

		for (const targetRole of invite.role) {
			const canManage = userRoles.some((actorRole) => canManageRole(actorRole, targetRole));
			if (!canManage) {
				throw new AppError({
					message: "You do not have permission to modify this invite",
					service: SERVICE_NAME,
					method: "updateInviteExpiry",
					status: 403,
				});
			}
		}

		const expiry = new Date(Date.now() + expiresInHours * HOUR_IN_MS);
		const updated = await this.invitesRepository.updateExpiryById({ id, teamId, expiry });
		return stripToken(updated);
	};

	deleteInvite = async ({ id, teamId, userRoles }: { id: string; teamId: string; userRoles: UserRole[] }) => {
		const invite = await this.invitesRepository.findById({ id, teamId });

		for (const targetRole of invite.role) {
			const canManage = userRoles.some((actorRole) => canManageRole(actorRole, targetRole));
			if (!canManage) {
				throw new AppError({
					message: "You do not have permission to delete this invite",
					service: SERVICE_NAME,
					method: "deleteInvite",
					status: 403,
				});
			}
		}

		await this.invitesRepository.deleteById({ id, teamId });
	};
}

const stripToken = (invite: Invite): InviteSummary => {
	const { token: _token, ...summary } = invite;
	return summary;
};
