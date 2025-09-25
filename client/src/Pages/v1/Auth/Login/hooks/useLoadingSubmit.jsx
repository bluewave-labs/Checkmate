// Hook to avoid double submits and manage loading state
import { useState, useCallback } from "react";

const useLoadingSubmit = () => {
	const [submitting, setSubmitting] = useState(false);
	const executeSubmit = useCallback(
		async (submitFunction) => {
			if (submitting) return;
			setSubmitting(true);
			try {
				return await submitFunction();
			} finally {
				setSubmitting(false);
			}
		},
		[submitting]
	);

	return { submitting, executeSubmit };
};

export default useLoadingSubmit;
