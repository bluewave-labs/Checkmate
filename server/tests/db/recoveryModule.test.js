import sinon from "sinon";
import RecoveryToken from "../../db/models/RecoveryToken.js";
import User from "../../db/models/User.js";
import {
	requestRecoveryToken,
	validateRecoveryToken,
	resetPassword,
} from "../../db/mongo/modules/recoveryModule.js";
import { errorMessages } from "../../utils/messages.js";

const mockRecoveryToken = {
	email: "test@test.com",
	token: "1234567890",
};

const mockUser = {
	email: "test@test.com",
	password: "oldPassword",
};

const mockUserWithoutPassword = {
	email: "test@test.com",
};

// Create a query builder that logs
const createQueryChain = (finalResult, comparePasswordResult = false) => ({
	select: () => ({
		select: async () => {
			if (finalResult === mockUser) {
				// Return a new object with all required methods
				return {
					email: "test@test.com",
					password: "oldPassword",
					comparePassword: sinon.stub().resolves(comparePasswordResult),
					save: sinon.stub().resolves(),
				};
			}
			return finalResult;
		},
	}),
	// Add methods to the top level too
	comparePassword: sinon.stub().resolves(comparePasswordResult),
	save: sinon.stub().resolves(),
});

describe("recoveryModule", function () {
	let deleteManyStub,
		saveStub,
		findOneStub,
		userCompareStub,
		userSaveStub,
		userFindOneStub;
	let req, res;

	beforeEach(function () {
		req = {
			body: { email: "test@test.com" },
		};
		deleteManyStub = sinon.stub(RecoveryToken, "deleteMany");
		saveStub = sinon.stub(RecoveryToken.prototype, "save");
		findOneStub = sinon.stub(RecoveryToken, "findOne");
		userCompareStub = sinon.stub(User.prototype, "comparePassword");
		userSaveStub = sinon.stub(User.prototype, "save");
		userFindOneStub = sinon.stub().resolves();
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("requestRecoveryToken", function () {
		it("should return a recovery token", async function () {
			deleteManyStub.resolves();
			saveStub.resolves(mockRecoveryToken);
			const result = await requestRecoveryToken(req, res);
			expect(result.email).to.equal(mockRecoveryToken.email);
		});

		it("should handle an error", async function () {
			const err = new Error("Test error");
			deleteManyStub.rejects(err);
			try {
				await requestRecoveryToken(req, res);
			} catch (error) {
				expect(error).to.exist;
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("validateRecoveryToken", function () {
		it("should return a recovery token if found", async function () {
			findOneStub.resolves(mockRecoveryToken);
			const result = await validateRecoveryToken(req, res);
			expect(result).to.deep.equal(mockRecoveryToken);
		});

		it("should thrown an error if a token is not found", async function () {
			findOneStub.resolves(null);
			try {
				await validateRecoveryToken(req, res);
			} catch (error) {
				expect(error).to.exist;
				expect(error.message).to.equal(errorMessages.DB_TOKEN_NOT_FOUND);
			}
		});

		it("should handle DB errors", async function () {
			const err = new Error("Test error");
			findOneStub.rejects(err);
			try {
				await validateRecoveryToken(req, res);
			} catch (error) {
				expect(error).to.exist;
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("resetPassword", function () {
		beforeEach(function () {
			req.body = {
				password: "test",
				newPassword: "test1",
			};
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should thrown an error if a recovery token is not found", async function () {
			findOneStub.resolves(null);
			try {
				await resetPassword(req, res);
			} catch (error) {
				expect(error).to.exist;
				expect(error.message).to.equal(errorMessages.DB_TOKEN_NOT_FOUND);
			}
		});

		it("should throw an error if a user is not found", async function () {
			findOneStub.resolves(mockRecoveryToken);
			userFindOneStub = sinon.stub(User, "findOne").resolves(null);
			try {
				await resetPassword(req, res);
			} catch (error) {
				expect(error).to.exist;
				expect(error.message).to.equal(errorMessages.DB_USER_NOT_FOUND);
			}
		});

		it("should throw an error if the passwords match", async function () {
			findOneStub.resolves(mockRecoveryToken);
			saveStub.resolves();
			userFindOneStub = sinon
				.stub(User, "findOne")
				.returns(createQueryChain(mockUser, true));
			try {
				await resetPassword(req, res);
			} catch (error) {
				expect(error).to.exist;
				expect(error.message).to.equal(errorMessages.DB_RESET_PASSWORD_BAD_MATCH);
			}
		});

		it("should return a user without password if successful", async function () {
			findOneStub.resolves(mockRecoveryToken);
			saveStub.resolves();
			userFindOneStub = sinon
				.stub(User, "findOne")
				.returns(createQueryChain(mockUser)) // First call will resolve to mockUser
				.onSecondCall()
				.returns(createQueryChain(mockUserWithoutPassword));
			const result = await resetPassword(req, res);
			expect(result).to.deep.equal(mockUserWithoutPassword);
		});
	});
});
