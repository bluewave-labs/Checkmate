import { useEffect, useRef, useState } from "react";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TextLink } from "@/Components/design-elements";
import { BaseAuthPage } from "@/Pages/Auth/components/BaseAuthPage";
import { setAuthState } from "@/Features/Auth/authSlice";
import { usePost } from "@/Hooks/UseApi";
import { SSO_STATE_KEY } from "@/Hooks/useSsoStatus";

// Callback error codes defined by the Connect contract
const CallbackErrors = [
	"sso_disabled",
	"invalid_request",
	"return_not_allowed",
	"access_denied",
	"idp_error",
	"denied_tenant",
	"denied_domain",
	"denied_unverified_email",
	"denied_no_group",
] as const;
type CallbackError = (typeof CallbackErrors)[number];

const isCallbackError = (value: string): value is CallbackError =>
	(CallbackErrors as readonly string[]).includes(value);

const SsoCallbackPage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { post, error: redeemError } = usePost();

	// Set when the failure has a fixed message; a failed redeem shows the server's message instead
	const [errorKey, setErrorKey] = useState<string | null>(null);
	const [redeemFailed, setRedeemFailed] = useState(false);
	// A code is single use, and effects run twice under StrictMode in development
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		const state = searchParams.get("state");
		const code = searchParams.get("code");
		const error = searchParams.get("error");

		const storedState = sessionStorage.getItem(SSO_STATE_KEY);
		sessionStorage.removeItem(SSO_STATE_KEY);

		// Checked first, so a forged callback never reaches redeem
		if (!state || !storedState || state !== storedState) {
			setErrorKey("pages.auth.sso.errors.stateInvalid");
			return;
		}

		if (error) {
			setErrorKey(`pages.auth.sso.errors.${isCallbackError(error) ? error : "generic"}`);
			return;
		}

		if (!code) {
			setErrorKey("pages.auth.sso.errors.generic");
			return;
		}

		const redeem = async () => {
			const result = await post("/sso/redeem", { code, state });
			if (result?.success) {
				dispatch(setAuthState(result));
				navigate("/dashboard", { replace: true });
				return;
			}
			setRedeemFailed(true);
		};
		redeem();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const message = errorKey
		? t(errorKey)
		: redeemFailed
			? redeemError || t("pages.auth.sso.errors.generic")
			: null;

	return (
		<BaseAuthPage
			title={t("pages.auth.sso.callback.title")}
			subtitle={t("pages.auth.sso.callback.subtitle")}
		>
			{message && (
				<>
					<Typography color={theme.palette.error.main}>{message}</Typography>
					<TextLink
						alignSelf={"center"}
						text={t("pages.auth.forgotPassword.links.login.text")}
						linkText={t("pages.auth.forgotPassword.links.login.linkText")}
						href="/login"
					/>
				</>
			)}
		</BaseAuthPage>
	);
};

export default SsoCallbackPage;
