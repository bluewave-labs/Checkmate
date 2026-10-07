import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuthState } from "@/Features/Auth/authSlice";
import type { User } from "@/Types/User";

// The session token arrives in the URL fragment. Fragments are never sent to a server, so it stays
// out of reverse-proxy access logs and Referer headers, unlike a query parameter.
const readTokenFromFragment = (): string =>
	new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token") ?? "";

// The token's payload is the user object the server signed (see UserService.issueToken), so the
// user can be read straight out of it with no extra request and no jwt-decode dependency.
// atob yields latin-1, so the bytes go through TextDecoder; otherwise a name like "Müller"
// arrives mangled.
const readUser = (token: string): User => {
	const payload = token.split(".")[1];
	if (!payload) throw new Error("Malformed session token");
	const bytes = Uint8Array.from(
		atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
		(char) => char.charCodeAt(0)
	);
	return JSON.parse(new TextDecoder().decode(bytes)) as User;
};

const SsoCallbackPage = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	useEffect(() => {
		const token = readTokenFromFragment();
		// Drop the token from the address bar and from history before anything else happens.
		window.history.replaceState(null, "", window.location.pathname);

		try {
			if (!token) throw new Error("No session token in callback");
			dispatch(
				setAuthState({ success: true, msg: "", data: { token, user: readUser(token) } })
			);
			navigate("/uptime", { replace: true });
		} catch {
			navigate("/login?sso_error=exchange_failed", { replace: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return null;
};

export default SsoCallbackPage;
