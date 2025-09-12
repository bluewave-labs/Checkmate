/**
 * Converts image to base64 string without resizing
 * CSS handles the 64x64 display sizing client-side
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
