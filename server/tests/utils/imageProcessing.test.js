import { expect } from "chai";
import { GenerateAvatarImage } from "../../src/utils/imageProcessing.js";

describe("imageProcessing - GenerateAvatarImage", function () {
	it("should return image as base64 string without resizing", async function () {
		const file = {
			buffer: Buffer.from("test image data"),
		};

		const result = await GenerateAvatarImage(file);

		// Verify the result matches the original buffer as base64
		const expected = Buffer.from("test image data").toString("base64");
		expect(result).to.equal(expected);
		expect(result).to.equal("dGVzdCBpbWFnZSBkYXRh");
	});

	it("should handle errors during buffer conversion", async function () {
		const file = {
			buffer: null, // Invalid buffer
		};

		try {
			await GenerateAvatarImage(file);
			expect.fail("Expected error to be thrown");
		} catch (error) {
			expect(error).to.be.an("error");
		}
	});
});
