import { describe, expect, it } from "@jest/globals";
import { SsoPolicyService } from "../../../src/domain/sso/sso-policy.service.ts";
import type { ConnectEnrollment, ConnectSsoState } from "../../../src/domain/connect/connect.type.ts";
import type { User } from "../../../src/domain/users/user.type.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

const sso = (overrides: Partial<ConnectSsoState> = {}): ConnectSsoState => ({
	enabled: true,
	provider: "entra",
	label: "Sign in with Microsoft",
	enforce: false,
	graceUntil: null,
	startUrl: "https://connect.checkmate.so/sso/start",
	fetchedAt: "2026-11-27T09:00:00.000Z",
	lastCheckRunAt: null,
	...overrides,
});

const makeUser = (overrides: Partial<User> = {}): User => ({
	id: "user-1",
	firstName: "Ada",
	lastName: "Lovelace",
	email: "ada@acme.com",
	isActive: true,
	isVerified: true,
	role: ["user"],
	teamId: "team-1",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	...overrides,
});

const linked = { provider: "entra", tenant: "tenant-1", subject: "sub-1", roleManaged: true, lastCheckedAt: null, deactivatedBySso: false } as const;

const setup = async (opts: { enrolled?: boolean; sso?: ConnectSsoState | null } = {}) => {
	const connectRepository = new InMemoryConnectRepository();
	if (opts.enrolled !== false) {
		const enrollment: ConnectEnrollment = { connectUrl: "wss://relay.checkmate.so/api/tunnel", agentId: "agent-1", token: "v1.token", apiUrl: null };
		await connectRepository.setEnrollment(enrollment);
	}
	if (opts.sso !== null) await connectRepository.setSsoState(opts.sso ?? sso());
	return { service: new SsoPolicyService(connectRepository) };
};

describe("SsoPolicyService.passwordLoginAllowed", () => {
	it("allows everyone when the installation is not enrolled", async () => {
		const { service } = await setup({ enrolled: false, sso: null });
		await expect(service.passwordLoginAllowed(makeUser({ sso: linked }))).resolves.toBe(true);
	});

	it("allows everyone when SSO is not enabled", async () => {
		const { service } = await setup({ sso: sso({ enabled: false, enforce: true }) });
		await expect(service.passwordLoginAllowed(makeUser({ sso: linked }))).resolves.toBe(true);
	});

	it("allows everyone when no SSO config has been synced yet", async () => {
		const { service } = await setup({ sso: null });
		await expect(service.passwordLoginAllowed(makeUser({ sso: linked }))).resolves.toBe(true);
	});

	it("allows the superadmin even when linked and enforced", async () => {
		const { service } = await setup({ sso: sso({ enforce: true }) });
		await expect(service.passwordLoginAllowed(makeUser({ role: ["superadmin"], sso: linked }))).resolves.toBe(true);
	});

	it("refuses a linked user while SSO is enabled", async () => {
		const { service } = await setup();
		await expect(service.passwordLoginAllowed(makeUser({ sso: linked }))).resolves.toBe(false);
	});

	it("refuses an unlinked user under enforce", async () => {
		const { service } = await setup({ sso: sso({ enforce: true }) });
		await expect(service.passwordLoginAllowed(makeUser())).resolves.toBe(false);
	});

	it("allows an unlinked user when enforce is off", async () => {
		const { service } = await setup();
		await expect(service.passwordLoginAllowed(makeUser())).resolves.toBe(true);
	});
});
