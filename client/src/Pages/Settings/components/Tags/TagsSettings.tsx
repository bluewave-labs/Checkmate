import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import { BaseFallback, EmptyFallback, ErrorFallback } from "@/Components/design-elements";
import { TagsTable } from "./TagsTable";
import { Dialog } from "@/Components/inputs";
import { HeaderCreate } from "@/Components/common";
import { LAYOUT } from "@/Utils/Theme/constants";

import { useState } from "react";
import { useGet, useDelete } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import type { Tag } from "@/Types/Tag";
import { useIsAdmin } from "@/Hooks/useIsAdmin";

export const TagsSettings = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isAdmin = useIsAdmin();

	const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
	const isDialogOpen = Boolean(selectedTag);

	const {
		data: tags,
		isLoading,
		isValidating,
		error,
		refetch,
	} = useGet<Tag[]>("/tags/team", {}, { keepPreviousData: true });

	const { deleteFn, loading: isDeleting } = useDelete();

	const handleConfirm = async () => {
		if (!selectedTag) return;
		await deleteFn(`/tags/${selectedTag.id}`);
		setSelectedTag(null);
		refetch();
	};

	const handleCancel = () => {
		setSelectedTag(null);
	};

	const isFetching = isLoading || isValidating;
	const hasItems = (tags?.length ?? 0) > 0;

	if (error) {
		return (
			<ErrorFallback
				title={t("common.fallback.error.title")}
				subtitle={t("common.fallback.error.description")}
			/>
		);
	}

	if (isFetching && !hasItems) {
		return (
			<BaseFallback>
				<CircularProgress
					color="primary"
					size={28}
				/>
			</BaseFallback>
		);
	}

	if (!hasItems) {
		return (
			<EmptyFallback
				title={t("pages.tags.fallback.title")}
				description={t("pages.tags.fallback.description")}
				showActionButton={isAdmin}
				actionButtonText={t("pages.tags.fallback.actionButton")}
				actionLink="/tags/create"
			/>
		);
	}

	return (
		<Stack spacing={theme.spacing(LAYOUT.LG)}>
			<HeaderCreate
				path="/tags/create"
				isLoading={isFetching}
				isAdmin={isAdmin}
			/>
			<TagsTable
				tags={tags ?? []}
				setSelectedTag={setSelectedTag}
			/>
			<Dialog
				open={isDialogOpen}
				title={t("common.dialogs.delete.title")}
				content={t("common.dialogs.delete.description")}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
				loading={isDeleting}
			/>
		</Stack>
	);
};
