import { useEffect } from "react";

export const useDocumentTitle = (title: string, enabled: boolean) => {
	useEffect(() => {
		if (!enabled) return;

		const previousTitle = document.title;

		document.title = title;

		return () => {
			document.title = previousTitle;
		};
	}, [title, enabled]);
};
