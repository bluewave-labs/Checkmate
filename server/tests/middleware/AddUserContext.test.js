import { addUserContext, invalidateCachesForUser } from "@/middleware/AddUserContext.js";
import * as Models from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

const mockReq = (user, headers = {}) => ({ user, headers });
const mockRes = () => ({ });
const mockNext = () => jest.fn();

describe("addUserContext", () => {
  beforeEach(() => {
    jest.spyOn(Models.TeamMembership, "find").mockReturnValue({ select: () => ({ lean: () => [] }) });
    jest.spyOn(Models.TeamMembership, "findOne").mockReturnValue({ populate: () => ({ select: () => ({ lean: () => ({ roleId: { name: "team-role" } }) }) }) });
    jest.spyOn(Models.OrgMembership, "findOne").mockReturnValue({ populate: () => ({ select: () => ({ lean: () => ({ roleId: { name: "org-role" } }) }) }) });
  });
  afterEach(() => jest.restoreAllMocks());

  it("throws when user missing", async () => {
    const req = mockReq(undefined, {});
    const res = mockRes();
    const next = mockNext();
    await addUserContext(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
  });

  it("throws when user not in selected team", async () => {
    jest.spyOn(Models.TeamMembership, "find").mockReturnValue({ select: () => ({ lean: () => [{ teamId: "t-2" }] }) });
    const req = mockReq({ sub: "u1", orgId: "o1" }, { "x-team-id": "t-1" });
    const res = mockRes();
    const next = mockNext();
    await addUserContext(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(403);
  });

  it("populates roles and proceeds", async () => {
    invalidateCachesForUser("u1");
    jest.spyOn(Models.TeamMembership, "find").mockReturnValue({ select: () => ({ lean: () => [{ teamId: { toString: () => "t-1" } }] }) });
    // roles already mocked in beforeEach

    const req = mockReq({ sub: "u1", orgId: "o1" }, { "x-team-id": "t-1" });
    const res = mockRes();
    const next = mockNext();
    await addUserContext(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.roles.orgRole).toEqual({ name: "org-role" });
    expect(req.user.roles.teamRole).toEqual({ name: "team-role" });
    expect(req.user.currentTeamId).toBe("t-1");
  });

  it("uses cached teamIds and roles when cache valid", async () => {
    // First call populates cache
    jest.spyOn(Models.TeamMembership, "find").mockReturnValue({ select: () => ({ lean: () => [{ teamId: { toString: () => "t-1" } }] }) });
    const req1 = mockReq({ sub: "u-cache", orgId: "o1" }, { "x-team-id": "t-1" });
    const next1 = mockNext();
    await addUserContext(req1, mockRes(), next1);
    expect(next1).toHaveBeenCalled();

    // Second call should hit cache and still succeed; mock find to fail if called
    jest.spyOn(Models.TeamMembership, "find").mockImplementation(() => { throw new Error("should not query"); });
    const req2 = mockReq({ sub: "u-cache", orgId: "o1" }, { "x-team-id": "t-1" });
    const next2 = mockNext();
    await addUserContext(req2, mockRes(), next2);
    expect(next2).toHaveBeenCalled();
  });

  it("invalidates caches for user", async () => {
    // Warm caches
    jest.spyOn(Models.TeamMembership, "find").mockReturnValue({ select: () => ({ lean: () => [{ teamId: { toString: () => "t-1" } }] }) });
    const req = mockReq({ sub: "u-inv", orgId: "o1" }, { "x-team-id": "t-1" });
    const next = mockNext();
    await addUserContext(req, mockRes(), next);
    expect(next).toHaveBeenCalled();

    // Invalidate and ensure it re-queries without throwing
    invalidateCachesForUser("u-inv");
    jest.spyOn(Models.TeamMembership, "find").mockReturnValue({ select: () => ({ lean: () => [{ teamId: { toString: () => "t-1" } }] }) });
    const next2 = mockNext();
    await addUserContext(mockReq({ sub: "u-inv", orgId: "o1" }, { "x-team-id": "t-1" }), mockRes(), next2);
    expect(next2).toHaveBeenCalled();
  });

  it("throws when org role missing", async () => {
    jest.spyOn(Models.TeamMembership, "find").mockReturnValue({ select: () => ({ lean: () => [{ teamId: { toString: () => "t-1" } }] }) });
    jest.spyOn(Models.OrgMembership, "findOne").mockReturnValue({ populate: () => ({ select: () => ({ lean: () => null }) }) });
    const req = mockReq({ sub: "u2", orgId: "o1" }, { "x-team-id": "t-1" });
    const next = mockNext();
    await addUserContext(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(403);
  });

  it("throws when team role missing", async () => {
    jest.spyOn(Models.TeamMembership, "find").mockReturnValue({ select: () => ({ lean: () => [{ teamId: { toString: () => "t-1" } }] }) });
    jest.spyOn(Models.OrgMembership, "findOne").mockReturnValue({ populate: () => ({ select: () => ({ lean: () => ({ roleId: { name: "org-role" } }) }) }) });
    jest.spyOn(Models.TeamMembership, "findOne").mockReturnValue({ populate: () => ({ select: () => ({ lean: () => null }) }) });
    const req = mockReq({ sub: "u3", orgId: "o1" }, { "x-team-id": "t-1" });
    const next = mockNext();
    await addUserContext(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(403);
  });
});
