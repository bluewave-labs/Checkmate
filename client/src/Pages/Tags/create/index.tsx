import { BasePage, ConfigBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mutate } from "swr";
import { useGet, usePost, usePatch } from "@/Hooks/UseApi";
import type { TagFormData } from "@/Validation/tag";
import type { Tag } from "@/Types/Tag";
import { useTranslation } from "react-i18next";
import { useTagsForm } from "@/Hooks/useTagsForm";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { FormColorField } from "@/Components/inputs/forms/FormColorField";

const TagsCreatePage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();
	const { tagId } = useParams<{ tagId: string }>();
	const isEditMode = Boolean(tagId);

	const { data: existingTag } = useGet<Tag>(isEditMode ? `/tags/${tagId}` : null);

	const { post, loading: isSubmitting } = usePost<TagFormData, Tag>();
	const { patch, loading: isPatching } = usePatch<TagFormData, Tag>();

	const { schema, defaults } = useTagsForm({ data: existingTag });

	const form = useForm<TagFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const { reset, handleSubmit } = form;

	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	const onSubmit = async (data: TagFormData) => {
		const result = isEditMode
			? await patch(`/tags/${tagId}`, data)
			: await post("/tags", data);
		if (result?.success) {
			await mutate((key) => typeof key === "string" && key.startsWith("/tags"));
			navigate("/tags");
		}
	};

	return (
		<FormProvider {...form}>
			<BasePage
				component="form"
				onSubmit={handleSubmit(onSubmit)}
			>
				<ConfigBox
					title={t("pages.tags.form.name.title")}
					subtitle={t("pages.tags.form.name.description")}
					rightContent={
						<FormTextField
							name="name"
							fieldLabel={t("pages.tags.form.name.optionName")}
							placeholder={t("pages.tags.form.name.placeholder")}
						/>
					}
				/>
				<ConfigBox
					title={t("pages.tags.form.color.title")}
					subtitle={t("pages.tags.form.color.description")}
					rightContent={
						<FormColorField
							name="color"
							fieldLabel={t("pages.tags.form.color.optionName")}
						/>
					}
				/>

				<Stack
					direction="row"
					justifyContent="flex-end"
					spacing={theme.spacing(2)}
				>
					<Button
						loading={isSubmitting || isPatching}
						type="submit"
						variant="contained"
						color="primary"
					>
						{t("common.buttons.save")}
					</Button>
				</Stack>
			</BasePage>
		</FormProvider>
	);
};

export default TagsCreatePage;
