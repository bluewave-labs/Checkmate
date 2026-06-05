import { BasePageWithStates } from "@/Components/design-elements";
import { TagsTable } from "@/Pages/Tags/components/TagsTable";
import { Dialog } from "@/Components/inputs";
import { HeaderCreate } from "@/Components/common";

import { useState } from "react";
import { useGet, useDelete } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import type { Tag } from "@/Types/Tag";
import { useIsAdmin } from "@/Hooks/useIsAdmin";

const TagsPage = () => {
	const { t } = useTranslation();
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

	return (
		<BasePageWithStates
			headerKey="tags"
			page={t("pages.tags.fallback.title")}
			description={t("pages.tags.fallback.description")}
			loading={isLoading || isValidating}
			error={!!error}
			totalCount={tags?.length ?? 0}
			actionButtonText={t("pages.tags.fallback.actionButton")}
			actionLink="/tags/create"
		>
			<HeaderCreate
				path="/tags/create"
				isLoading={isLoading || isValidating}
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
		</BasePageWithStates>
	);
};

export default TagsPage;
