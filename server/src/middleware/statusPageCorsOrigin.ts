import type { CorsOptions } from "cors";
import type { IStatusPagesRepository } from "@/repositories/index.js";
import { normalizeStatusPageDomain } from "@/utils/statusPageDomain.js";

export const createStatusPageCorsOrigin = (clientHost: string, statusPagesRepository: IStatusPagesRepository): CorsOptions["origin"] => {
	return (origin, callback) => {
		if (!origin) {
			callback(null, true);
			return;
		}

		if (origin === clientHost) {
			callback(null, true);
			return;
		}

		let customDomain: string | null = null;
		try {
			customDomain = normalizeStatusPageDomain(new URL(origin).hostname);
		} catch {
			callback(null, false);
			return;
		}

		if (!customDomain) {
			callback(null, false);
			return;
		}

		statusPagesRepository
			.findByCustomDomain(customDomain)
			.then((statusPage) => {
				callback(null, statusPage.isPublished ? origin : false);
			})
			.catch(() => {
				callback(null, false);
			});
	};
};
