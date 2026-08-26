import { Stack } from "@mui/material";
import { ConfigBox } from "@/Components/design-elements";
import { Button } from "@/Components/inputs";
import { ImageUpload } from "@/Components/inputs";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { useProfileForm } from "@/Hooks/useProfileForm";
import { usePatch } from "@/Hooks/UseApi";
import { setUser } from "@/Features/Auth/authSlice";
import type { ProfileFormData } from "@/Validation/profile";
import type { RootState } from "@/Types/state";
import type { User } from "@/Types/User";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { LAYOUT } from "@/Utils/Theme/constants";

export const TabProfile = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const user = useSelector((state: RootState) => state.auth?.user);
	const { resolver, defaults } = useProfileForm();
	const { patch, loading: patchLoading } = usePatch<FormData, User>();

	const form = useForm<ProfileFormData>({
		resolver,
		defaultValues: {
			firstName: user?.firstName ?? defaults.firstName,
			lastName: user?.lastName ?? defaults.lastName,
			profileImage: defaults.profileImage,
			deleteProfileImage: defaults.deleteProfileImage,
		},
	});
	const { handleSubmit, setValue, watch } = form;
	const currentImage = watch("profileImage");
	const deleteImage = watch("deleteProfileImage");

	const getCurrentImageSrc = () => {
		if (deleteImage) return undefined;
		if (currentImage) return URL.createObjectURL(currentImage);
		if (user?.avatarImage) return `data:image/png;base64,${user.avatarImage}`;
		return undefined;
	};

	const handleImageChange = (
		fileObj: { src: string; name: string; file: File } | undefined
	) => {
		if (fileObj) {
			setValue("profileImage", fileObj.file);
			setValue("deleteProfileImage", false);
		} else {
			setValue("profileImage", null);
			setValue("deleteProfileImage", true);
		}
	};

	const onSubmit = async (data: ProfileFormData) => {
		const fd = new FormData();
		fd.append("firstName", data.firstName);
		fd.append("lastName", data.lastName);

		if (data.profileImage) {
			fd.append("profileImage", data.profileImage);
		}

		if (data.deleteProfileImage) {
			fd.append("deleteProfileImage", "true");
		}

		const result = await patch("/auth/user", fd);
		if (result?.success && result.data) {
			dispatch(setUser(result.data));
		}
	};

	return (
		<FormProvider {...form}>
			<Stack
				gap={theme.spacing(LAYOUT.MD)}
				component="form"
				onSubmit={handleSubmit(onSubmit)}
			>
				<ConfigBox
					title={t("pages.account.form.name.title")}
					subtitle={t("pages.account.form.name.description")}
					rightContent={
						<Stack gap={theme.spacing(LAYOUT.MD)}>
							<FormTextField
								name="firstName"
								autoComplete="given-name"
								fieldLabel={t("common.form.name.option.firstName.label")}
								placeholder={t("common.form.name.option.firstName.placeholder")}
							/>
							<FormTextField
								name="lastName"
								autoComplete="family-name"
								fieldLabel={t("common.form.name.option.lastName.label")}
								placeholder={t("common.form.name.option.lastName.placeholder")}
							/>
						</Stack>
					}
				/>
				<ConfigBox
					title={t("pages.account.form.photo.title")}
					subtitle={t("pages.account.form.photo.description")}
					rightContent={
						<ImageUpload
							src={getCurrentImageSrc()}
							onChange={handleImageChange}
						/>
					}
				/>
				<Button
					type="submit"
					variant="contained"
					color="primary"
					loading={patchLoading}
					sx={{ alignSelf: "flex-end", minWidth: 100 }}
				>
					{t("common.buttons.save")}
				</Button>
			</Stack>
		</FormProvider>
	);
};
