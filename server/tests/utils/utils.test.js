import { ParseBoolean, getTokenFromHeaders } from "../../utils/utils.js";

describe("utils - ParseBoolean", function () {
	it("should return true", function () {
		const result = ParseBoolean("true");
		expect(result).to.be.true;
	});

	it("should return false", function () {
		const result = ParseBoolean("false");
		expect(result).to.be.false;
	});

	it("should return false", function () {
		const result = ParseBoolean(null);
		expect(result).to.be.false;
	});

	it("should return false", function () {
		const result = ParseBoolean(undefined);
		expect(result).to.be.false;
	});
});

describe("utils - getTokenFromHeaders", function () {
	it("should throw an error if authorization header is missing", function () {
		const headers = {};
		expect(() => getTokenFromHeaders(headers)).to.throw("No auth headers");
	});

	it("should throw an error if authorization header does not start with Bearer", function () {
		const headers = { authorization: "Basic abcdef" };
		expect(() => getTokenFromHeaders(headers)).to.throw("Invalid auth headers");
	});

	it("should return the token if authorization header is correctly formatted", function () {
		const headers = { authorization: "Bearer abcdef" };
		expect(getTokenFromHeaders(headers)).to.equal("abcdef");
	});

	it("should throw an error if authorization header has more than two parts", function () {
		const headers = { authorization: "Bearer abc def" };
		expect(() => getTokenFromHeaders(headers)).to.throw("Invalid auth headers");
	});

	it("should throw an error if authorization header has less than two parts", function () {
		const headers = { authorization: "Bearer" };
		expect(() => getTokenFromHeaders(headers)).to.throw("Invalid auth headers");
	});
});
