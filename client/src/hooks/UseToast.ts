import { toast, type ToastOptions } from "react-toastify";
export const useToast = () => {
  const showToast = (message: string, options?: ToastOptions) => {
    toast.dismiss();
    toast(message, options);
  };

  const toastSuccess = (msg: string, opts?: ToastOptions) =>
    showToast(msg, { ...opts, type: "success" });
  const toastError = (msg: string, opts?: ToastOptions) =>
    showToast(msg, { ...opts, type: "error" });
  const toastInfo = (msg: string, opts?: ToastOptions) =>
    showToast(msg, { ...opts, type: "info" });

  return { showToast, toastSuccess, toastError, toastInfo };
};
