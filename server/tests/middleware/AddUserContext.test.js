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
});
