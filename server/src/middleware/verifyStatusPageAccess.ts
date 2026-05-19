import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { IStatusPagesRepository } from "@/repositories/index.js";
import { ISettingsService } from "@/service/system/settingsService.js";
import { AppError } from "@/utils/AppError.js";
import { buildCookieName, verifyUnlockToken } from "@/utils/statusPagePasswordCookie.js";

interface MaybeAdminClaims {
	teamId?: string;
	role?: string[];
}

const tryDecodeAdminJwt = (header: string | undefined, secret: string): MaybeAdminClaims | null => {
	if (!header || !header.startsWith("Bearer ")) return null;
	const token = header.slice("Bearer ".length);
	try {
		const decoded = jwt.verify(token, secret) as Record<string, unknown>;
		if (typeof decoded !== "object" || decoded === null) return null;
		if ((decoded as { kind?: string }).kind === "statuspage") return null;
		return {
			teamId: typeof decoded.teamId === "string" ? decoded.teamId : undefined,
			role: Array.isArray(decoded.role) ? decoded.role.filter((r): r is string => typeof r === "string") : undefined,
		};
	} catch {
		return null;
	}
};

export const createVerifyStatusPageAccess = (
	statusPagesRepository: IStatusPagesRepository,
	verifyJWT: RequestHandler,
	settingsService: ISettingsService
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const url = Array.isArray(req.params.url) ? req.params.url[0] : req.params.url;
			if (!url) {
				throw new AppError({ message: "Status page URL is required", status: 400 });
			}

			const statusPage = await statusPagesRepository.findByUrlWithSecret(url);

			if (!statusPage.isPublished) {
				// Unpublished pages are admin-only. We enforce team scoping here so the
				// password gate isn't silently bypassed: without this check, any
				// authenticated user from any team could reach the controller and rely
				// on its team-match for protection. Defense-in-depth keeps the
				// middleware authoritative even if the controller is later refactored.
				return verifyJWT(req, res, (err) => {
					if (err) return next(err);
					if (req.user?.teamId !== statusPage.teamId) {
						return res.status(403).json({ success: false, msg: "Forbidden" });
					}
					return next();
				});
			}

			if (!statusPage.passwordHash) {
				return next();
			}

			const { jwtSecret } = settingsService.getSettings();

			const adminClaims = tryDecodeAdminJwt(req.headers.authorization, jwtSecret);
			if (adminClaims) {
				const isSuperadmin = adminClaims.role?.includes("superadmin") ?? false;
				const isOwningTeam = adminClaims.teamId === statusPage.teamId;
				if (isSuperadmin || isOwningTeam) {
					return next();
				}
			}

			const cookieName = buildCookieName(statusPage.id);
			const token = req.cookies?.[cookieName];
			if (token) {
				const claims = verifyUnlockToken(token, jwtSecret);
				if (claims && claims.statusPageId === statusPage.id && claims.pv === statusPage.passwordVersion) {
					return next();
				}
			}

			return res.status(401).json({
				success: false,
				msg: "Password required",
				requiresPassword: true,
				statusPageId: statusPage.id,
				branding: {
					companyName: statusPage.companyName,
					logo: statusPage.logo ?? null,
					color: statusPage.color,
					theme: statusPage.theme,
					themeMode: statusPage.themeMode,
				},
			});
		} catch (error) {
			next(error);
		}
	};
};
