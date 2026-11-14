import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { patch } from "@/Utils/ApiClient";
import { setUser } from "@/Features/Auth/authSlice";
import { logger } from "@/Utils/logger";
import { WHATS_NEW_ID } from "@/Components/whats-new/steps";
import type { ApiResponse } from "@/Hooks/UseApi";
import type { RootState } from "@/Types/state";
import type { User } from "@/Types/User";

// Fallback for roles that can't edit their own user (demo) and for when saving to the user fails
const STORAGE_KEY = "whatsNewSeen";

const readLocal = () => {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
};

const writeLocal = () => {
	try {
		localStorage.setItem(STORAGE_KEY, WHATS_NEW_ID);
	} catch {
		// Storage can be unavailable (private mode, blocked site data); the user field still records it
	}
};

// Opens the "What's new" popup once per user. It counts as seen as soon as it opens, so a refresh
// or closing it at any step doesn't bring it back.
export const useWhatsNew = () => {
	const dispatch = useDispatch();
	const user = useSelector((state: RootState) => state.auth.user);
	const [open, setOpen] = useState(false);
	const handled = useRef(false);

	useEffect(() => {
		if (!user || handled.current) return;
		handled.current = true;
		if (user.whatsNewSeen === WHATS_NEW_ID || readLocal() === WHATS_NEW_ID) return;

		setOpen(true);
		writeLocal();
		if (user.role.includes("demo")) return;

		const body = new FormData();
		body.append("whatsNewSeen", WHATS_NEW_ID);
		patch<ApiResponse<User>>("/auth/user", body)
			.then((res) => {
				if (res.data?.data) dispatch(setUser(res.data.data));
			})
			.catch((error: unknown) => {
				logger.error(
					"Failed to save the What's new popup as seen",
					error instanceof Error ? error : undefined
				);
			});
	}, [user, dispatch]);

	return { open, close: () => setOpen(false) };
};
