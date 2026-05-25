import type { StatusPage } from "../../src/types/index.ts";

export const makeStatusPage = (overrides?: Partial<StatusPage>): StatusPage =>
	({
		id: "sp-1",
		teamId: "team-1",
		userId: "user-1",
		url: "my-status-page",
		companyName: "Test Co",
		monitors: ["mon-1"],
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as StatusPage;
