import sharp from "sharp";
/**
 * Generates a 64 * 64 pixel image from a given image
 * @param {} file
 */
const GenerateAvatarImage = async (file) => {
	try {
		// Resize to target 64 * 64
		let resizedImageBuffer = await sharp(file.buffer)
			.resize({
				width: 64,
				height: 64,
				fit: "cover",
			})
			.toBuffer();

		//Get b64 string
		const base64Image = resizedImageBuffer.toString("base64");
		return base64Image;
	} catch (error) {
		throw error;
	}
};

export { GenerateAvatarImage };
