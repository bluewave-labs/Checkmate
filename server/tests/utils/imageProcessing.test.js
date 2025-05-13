import { expect } from "chai";
import sinon from "sinon";
import sharp from "sharp";
import { GenerateAvatarImage } from "../../utils/imageProcessing.js";

describe("imageProcessing - GenerateAvatarImage", function () {
	it("should resize the image to 64x64 and return a base64 string", async function () {
		const file = {
			buffer: Buffer.from("test image buffer"),
		};

		// Stub the sharp function
		const toBufferStub = sinon.stub().resolves(Buffer.from("resized image buffer"));
		const resizeStub = sinon.stub().returns({ toBuffer: toBufferStub });
		const sharpStub = sinon
			.stub(sharp.prototype, "resize")
			.returns({ toBuffer: toBufferStub });

		const result = await GenerateAvatarImage(file);

		// Verify the result
		const expected = Buffer.from("resized image buffer").toString("base64");
		expect(result).to.equal(expected);

		// Verify that the sharp function was called with the correct arguments
		expect(sharpStub.calledOnceWith({ width: 64, height: 64, fit: "cover" })).to.be.true;
		expect(toBufferStub.calledOnce).to.be.true;

		// Restore the stubbed functions
		sharpStub.restore();
	});

	it("should throw an error if resizing fails", async function () {
		const file = {
			buffer: Buffer.from("test image buffer"),
		};

		// Stub the sharp function to throw an error
		const toBufferStub = sinon.stub().rejects(new Error("Resizing failed"));
		const resizeStub = sinon.stub().returns({ toBuffer: toBufferStub });
		const sharpStub = sinon
			.stub(sharp.prototype, "resize")
			.returns({ toBuffer: toBufferStub });

		try {
			await GenerateAvatarImage(file);
			// If no error is thrown, fail the test
			expect.fail("Expected error to be thrown");
		} catch (error) {
			// Verify that the error message is correct
			expect(error.message).to.equal("Resizing failed");
		}

		// Restore the stubbed functions
		sharpStub.restore();
	});
});
