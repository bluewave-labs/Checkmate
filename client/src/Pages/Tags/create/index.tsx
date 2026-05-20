import { BasePage, ConfigBox } from "@/Components/design-elements";
import { TextField, Button, ColorInput } from "@/Components/inputs";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mutate } from "swr";
import { useGet, usePost, usePatch } from "@/Hooks/UseApi";
import type { TagFormData } from "@/Validation/tag";
import type { Tag } from "@/Types/Tag";
import { useTranslation } from "react-i18next";
import { useTagsForm } from "@/Hooks/useTagsForm";

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

	const { control, reset, handleSubmit } = form;

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
		<BasePage
			component="form"
			onSubmit={handleSubmit(onSubmit)}
		>
			<ConfigBox
				title={t("pages.tags.form.name.title")}
				subtitle={t("pages.tags.form.name.description")}
				rightContent={
					<Controller
						name="name"
						control={control}
						defaultValue={defaults.name}
						render={({ field, fieldState }) => (
							<TextField
								{...field}
								type="text"
								fieldLabel={t("pages.tags.form.name.optionName")}
								placeholder={t("pages.tags.form.name.placeholder")}
								fullWidth
								error={!!fieldState.error}
								helperText={fieldState.error?.message ?? ""}
							/>
						)}
					/>
				}
			/>
			<ConfigBox
				title={t("pages.tags.form.color.title")}
				subtitle={t("pages.tags.form.color.description")}
				rightContent={
					<Controller
						name="color"
						control={control}
						defaultValue={defaults.color}
						render={({ field }) => (
							<ColorInput
								format="hex"
								value={field.value}
								onChange={field.onChange}
								fieldLabel={t("pages.tags.form.color.optionName")}
							/>
						)}
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
	);
};

export default TagsCreatePage;
