/**
 * Stores avatar image as base64 without resizing
 * Resizing is handled client-side via CSS object-fit: cover
 * @param {} file
 */
const GenerateAvatarImage = async (file) => {
	try {
		// Simply convert to base64 - let CSS handle the 64x64 display
		const base64Image = file.buffer.toString("base64");
		return base64Image;
	} catch (error) {
		throw error;
	}
};

export { GenerateAvatarImage };
