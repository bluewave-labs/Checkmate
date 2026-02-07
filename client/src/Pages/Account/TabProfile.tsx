import { Stack, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { ConfigBox } from "@/Components/v2/design-elements";
import { TextField, Button } from "@/Components/v2/inputs";
import { ImageUpload } from "@/Components/v2/inputs";
import { useProfileForm } from "@/Hooks/useProfileForm";
import { usePatch } from "@/Hooks/UseApi";
import { setUser } from "@/Features/Auth/authSlice";
import type { ProfileFormData } from "@/Validation/profile";
import type { RootState } from "@/Types/state";
import type { User } from "@/Types/User";

export const TabProfile = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const user = useSelector((state: RootState) => state.auth?.user);
	const { resolver, defaults } = useProfileForm();
	const { patch, loading: patchLoading } = usePatch<FormData, User>();

	const { control, handleSubmit, setValue, watch } = useForm<ProfileFormData>({
		resolver,
		defaultValues: {
			firstName: user?.firstName ?? defaults.firstName,
			lastName: user?.lastName ?? defaults.lastName,
			profileImage: defaults.profileImage,
			deleteProfileImage: defaults.deleteProfileImage,
		},
	});

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
		<>
			<Box
				component="form"
				onSubmit={handleSubmit(onSubmit)}
				noValidate
			>
				<Stack gap={4}>
					<ConfigBox
						title={t("pages.account.form.name.title")}
						subtitle={t("pages.account.form.name.description")}
						rightContent={
							<Stack gap={3}>
								<Controller
									name="firstName"
									control={control}
									render={({ field, fieldState }) => (
										<TextField
											{...field}
											fieldLabel={t("pages.account.form.name.option.firstName.label")}
											placeholder={t(
												"pages.account.form.name.option.firstName.placeholder"
											)}
											autoComplete="given-name"
											error={!!fieldState.error}
											helperText={fieldState.error?.message ?? ""}
										/>
									)}
								/>
								<Controller
									name="lastName"
									control={control}
									render={({ field, fieldState }) => (
										<TextField
											{...field}
											fieldLabel={t("pages.account.form.name.option.lastName.label")}
											placeholder={t(
												"pages.account.form.name.option.lastName.placeholder"
											)}
											autoComplete="family-name"
											error={!!fieldState.error}
											helperText={fieldState.error?.message ?? ""}
										/>
									)}
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
			</Box>
		</>
	);
};
