export const formatBytes = (bytes) => {
	if (bytes === 0) return "0 Bytes";
	const megabytes = bytes / (1024 * 1024);
	return megabytes.toFixed(2) + " MB";
};

export const checkImage = (url) => {
	const img = new Image();
	img.src = url;
	return img.naturalWidth !== 0;
};
