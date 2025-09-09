import GenericFallback from "../GenericFallback";
import Fallback from "../Fallback";
import { Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useIsAdmin } from "../../Hooks/useIsAdmin";
import PropTypes from "prop-types";
const PageStateWrapper = ({
	networkError,
	isLoading,
	items,
	type,
	fallbackLink,
	fallbackChildren,
	children,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const isAdmin = useIsAdmin();
	const isEmpty = items === null || (Array.isArray(items) && items.length === 0);
	const hasInitialized = items !== undefined && !(isLoading && isEmpty);
	const showEmpty = !isLoading && isEmpty;
	if (networkError) {
		return (
			<GenericFallback>
				<Typography
					variant="h1"
					marginY={theme.spacing(4)}
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("common.toasts.networkError")}
				</Typography>
				<Typography>{t("common.toasts.checkConnection")}</Typography>
			</GenericFallback>
		);
	}
	if (!hasInitialized) {
		return null;
	}
	if (showEmpty) {
		return (
			<Fallback
				type={type}
				title={t(`${type}.fallback.title`)}
				checks={t(`${type}.fallback.checks`, { returnObjects: true })}
				link={fallbackLink}
				isAdmin={isAdmin}
			>
				{fallbackChildren}
			</Fallback>
		);
	}
	return <>{children}</>;
};

PageStateWrapper.propTypes = {
	networkError: PropTypes.any,
	isLoading: PropTypes.bool,
	items: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf([null])]),
	type: PropTypes.string,
	fallbackLink: PropTypes.string,
	fallbackChildren: PropTypes.node,
	children: PropTypes.node,
};

export default PageStateWrapper;
