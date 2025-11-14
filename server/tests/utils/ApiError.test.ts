import ApiError from "@/utils/ApiError.js";

describe("ApiError", () => {
	it("captures message and status", () => {
		const error = new ApiError("boom", 418);
		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe("boom");
		expect(error.status).toBe(418);
		expect(error.name).toBe("ApiError");
	});

	it("defaults status to 500", () => {
		const error = new ApiError("failure");
		expect(error.status).toBe(500);
	});
});

