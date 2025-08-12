import { useDispatch } from "react-redux";
import { login } from "../../../../Features/Auth/authSlice";
import { useNavigate } from "react-router-dom";
import { createToast } from "../../../../Utils/toastUtils";
import { useTranslation } from "react-i18next";

const useLoginSubmit = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const handleLoginSubmit = async (form, setErrors) => {
		const action = await dispatch(login(form));
		if (action.payload.success) {
			navigate("/uptime");
			createToast({
				body: t("auth.login.toasts.success"),
			});
		} else {
			if (action.payload) {
				if (action.payload.msg === "Incorrect password")
					setErrors({
						password: t("auth.login.errors.password.incorrect"),
					});
				// dispatch errors
				createToast({
					body: t("auth.login.toasts.incorrectPassword"),
				});
			} else {
				// unknown errors
				createToast({
					body: t("common.toasts.unknownError"),
				});
			}
		}
	};
	return [handleLoginSubmit];
};

export default useLoginSubmit;
