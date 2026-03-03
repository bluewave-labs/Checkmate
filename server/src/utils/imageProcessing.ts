import sharp from "sharp";

const GenerateAvatarImage = async (file: Express.Multer.File) => {
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
};

export { GenerateAvatarImage };
