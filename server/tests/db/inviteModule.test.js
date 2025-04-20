import sinon from "sinon";
import InviteToken from "../../db/models/InviteToken.js";
import {
	requestInviteToken,
	getInviteToken,
	getInviteTokenAndDelete,
} from "../../db/mongo/modules/inviteModule.js";
import { errorMessages } from "../../utils/messages.js";

describe("Invite Module", function () {
	const mockUserData = {
		email: "test@test.com",
		teamId: "123",
		role: ["admin"],
		token: "123",
	};
	const mockInviteToken = { _id: 123, time: 123 };
	let inviteTokenDeleteManyStub,
		inviteTokenSaveStub,
		inviteTokenFindOneStub,
		inviteTokenFindOneAndDeleteStub;

	beforeEach(function () {
		inviteTokenDeleteManyStub = sinon.stub(InviteToken, "deleteMany");
		inviteTokenSaveStub = sinon.stub(InviteToken.prototype, "save");
		inviteTokenFindOneStub = sinon.stub(InviteToken, "findOne");
		inviteTokenFindOneAndDeleteStub = sinon.stub(InviteToken, "findOneAndDelete");
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("requestInviteToken", function () {
		it("should return a new invite token", async function () {
			inviteTokenDeleteManyStub.resolves();
			inviteTokenSaveStub.resolves();
			const inviteToken = await requestInviteToken(mockUserData);
			expect(inviteToken.email).to.equal(mockUserData.email);
			expect(inviteToken.role).to.deep.equal(mockUserData.role);
			expect(inviteToken.token).to.exist;
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			inviteTokenDeleteManyStub.rejects(err);
			try {
				await requestInviteToken(mockUserData);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("getInviteToken", function () {
		it("should return an invite token", async function () {
			inviteTokenFindOneStub.resolves(mockInviteToken);
			const inviteToken = await getInviteToken(mockUserData.token);
			expect(inviteToken).to.deep.equal(mockInviteToken);
		});

		it("should handle a token not found", async function () {
			inviteTokenFindOneStub.resolves(null);
			try {
				await getInviteToken(mockUserData.token);
			} catch (error) {
				expect(error.message).to.equal(errorMessages.AUTH_INVITE_NOT_FOUND);
			}
		});

		it("should handle DB errors", async function () {
			const err = new Error("test error");
			inviteTokenFindOneStub.rejects(err);
			try {
				await getInviteToken(mockUserData.token);
			} catch (error) {
				expect(error).to.deep.equal(err);
				expect(error.method).to.equal("getInviteToken");
			}
		});
	});

	describe("getInviteTokenAndDelete", function () {
		it("should return a deleted invite", async function () {
			inviteTokenFindOneAndDeleteStub.resolves(mockInviteToken);
			const deletedInvite = await getInviteTokenAndDelete(mockUserData.token);
			expect(deletedInvite).to.deep.equal(mockInviteToken);
		});

		it("should handle a token not found", async function () {
			inviteTokenFindOneAndDeleteStub.resolves(null);
			try {
				await getInviteTokenAndDelete(mockUserData.token);
			} catch (error) {
				expect(error.message).to.equal(errorMessages.AUTH_INVITE_NOT_FOUND);
			}
		});

		it("should handle DB errors", async function () {
			const err = new Error("test error");
			inviteTokenFindOneAndDeleteStub.rejects(err);
			try {
				await getInviteTokenAndDelete(mockUserData.token);
			} catch (error) {
				expect(error).to.deep.equal(err);
				expect(error.method).to.equal("getInviteTokenAndDelete");
			}
		});
	});
});
