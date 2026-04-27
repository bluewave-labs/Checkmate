import { toast, type ToastOptions } from "react-toastify";

export const useToast = () => {
	const showToast = (message: string, options?: ToastOptions) => {
		toast.dismiss();
		const baseStyle: React.CSSProperties = {
			whiteSpace: "pre-line",
			wordBreak: "break-word",
		};
		toast(message, {
			...options,
			style: { ...baseStyle, ...(options?.style || {}) },
		});
	};

	const toastSuccess = (msg: string, opts?: ToastOptions) =>
		showToast(msg, { ...opts, type: "success" });
	const toastError = (msg: string, opts?: ToastOptions) =>
		showToast(msg, { ...opts, type: "error" });
	const toastInfo = (msg: string, opts?: ToastOptions) =>
		showToast(msg, { ...opts, type: "info" });

	return { showToast, toastSuccess, toastError, toastInfo };
};
