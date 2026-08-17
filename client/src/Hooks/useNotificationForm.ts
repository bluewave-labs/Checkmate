import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { notificationEditSchema, notificationSchema } from "@/Validation/notifications";
import type { NotificationFormData } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";

interface UseNotificationFormOptions {
	data?: Notification | null;
	/** True once the user has asked to replace the stored credential, which reveals its field. */
	isCredentialReset?: boolean;
}

function buildDefaults(data: Notification | null): NotificationFormData {
	return {
		type: data?.type ?? "email",
		notificationName: data?.notificationName || "",
		address: data?.address || "",
		// Never seeded from the API: credentials are not returned, and an unchanged one is kept by
		// leaving it out of the payload.
		accessToken: "",
		accountSid: data?.accountSid || "",
		phone: data?.phone || "",
		twilioPhoneNumber: data?.twilioPhoneNumber || "",
		homeserverUrl: data?.homeserverUrl || "",
		roomId: data?.roomId || "",
		topic: data?.topic || "",
	};
}

export const useNotificationForm = ({
	data = null,
	isCredentialReset = false,
}: UseNotificationFormOptions = {}) => {
	// Only the fetched notification may rebuild the defaults. Asking to replace a credential swaps
	// the schema but must not hand the form a new defaults object, which would reset it and discard
	// whatever the user has already typed.
	const defaults = useMemo(() => buildDefaults(data), [data]);

	/**
	 * Whether the stored credential is being kept, meaning its field stays hidden and it is left out
	 * of the payload. It is kept only while the user has not asked to replace it *and* the selected
	 * channel type still matches the one it was stored against: a credential belongs to the provider
	 * it was issued by, so switching type has to ask for a new one rather than carry the old one over.
	 */
	const isCredentialKept = (type: NotificationFormData["type"]) =>
		Boolean(data?.accessTokenSet) && !isCredentialReset && type === data?.type;

	// The schema depends on the type currently selected in the form, so it is resolved per validation
	// run rather than fixed at render time.
	const resolver: Resolver<NotificationFormData> = (values, context, options) =>
		zodResolver(
			isCredentialKept(values.type) ? notificationEditSchema : notificationSchema
		)(values, context, options);

	return { resolver, defaults, isCredentialKept };
};
