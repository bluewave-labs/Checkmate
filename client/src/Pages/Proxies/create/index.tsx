import { BasePage, ConfigBox } from "@/Components/design-elements";
import { LAYOUT } from "@/Utils/Theme/constants";
import { Button, FieldLabel } from "@/Components/inputs";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mutate } from "swr";
import { useGet, usePost, usePatch } from "@/Hooks/UseApi";
import type { ProxyFormData } from "@/Validation/proxy";
import { ProxyProtocols, type ProxyResponse } from "@/Types/Proxy";
import { useTranslation } from "react-i18next";
import { useProxiesForm } from "@/Hooks/useProxiesForm";
import { FormTextField } from "@/Components/inputs/forms/FormTextField";
import { FormSelectField } from "@/Components/inputs/forms/FormSelectField";
import { useMemo } from "react";
import { FormNumberField } from "@/Components/inputs/forms/FormNumberField";
const ProxiesCreatePage = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const navigate = useNavigate();
	const { proxyId } = useParams<{ proxyId: string }>();
	const isEditMode = Boolean(proxyId);

	const { data: existingProxy } = useGet<ProxyResponse>(
		isEditMode ? `/proxies/${proxyId}` : null
	);

	const { post, loading: isSubmitting } = usePost<ProxyFormData, ProxyResponse>();
	const { patch, loading: isPatching } = usePatch<ProxyFormData, ProxyResponse>();

	const { schema, defaults } = useProxiesForm({ data: existingProxy });

	const form = useForm<ProxyFormData>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});

	const { reset, handleSubmit } = form;

	const isPasswordSet = existingProxy?.hasPassword ?? false;
	const [passwordHasBeenReset, setPasswordHasBeenReset] = useState(false);

	const handleResetPassword = () => {
		form.setValue("password", "");
		setPasswordHasBeenReset(true);
	};

	const isUsernameSet = Boolean(existingProxy?.username);
	const [usernameHasBeenReset, setUsernameHasBeenReset] = useState(false);

	const handleResetUsername = () => {
		form.setValue("username", "");
		setUsernameHasBeenReset(true);
	};

	const protocolOptions = useMemo(
		() =>
			ProxyProtocols.map((protocol) => ({
				value: protocol,
				label: protocol,
			})),
		[]
	);

	useEffect(() => {
		reset(defaults);
	}, [defaults, reset]);

	const onSubmit = async (data: ProxyFormData) => {
		const payload: ProxyFormData & { clearPassword?: boolean; clearUsername?: boolean } =
			{
				...data,
			};
		// Don't send password/username if one is set and the user hasn't clicked reset
		if (isPasswordSet && !passwordHasBeenReset) {
			delete payload.password;
		} else if (passwordHasBeenReset && !payload.password) {
			payload.clearPassword = true;
		}
		if (isUsernameSet && !usernameHasBeenReset) {
			delete payload.username;
		} else if (usernameHasBeenReset && !payload.username) {
			payload.clearUsername = true;
		}
		const result = isEditMode
			? await patch(`/proxies/${proxyId}`, payload)
			: await post("/proxies", payload);
		if (result?.success) {
			await mutate((key) => typeof key === "string" && key.startsWith("/proxies"));
			navigate("/proxies");
		}
	};

	return (
		<FormProvider {...form}>
			<BasePage
				component="form"
				onSubmit={handleSubmit(onSubmit)}
			>
				<ConfigBox
					title={t("pages.proxies.form.name.title")}
					subtitle={t("pages.proxies.form.name.description")}
					rightContent={
						<FormTextField
							name="name"
							fieldLabel={t("pages.proxies.form.name.optionName")}
							placeholder={t("pages.proxies.form.name.placeholder")}
						/>
					}
				/>
				<ConfigBox
					title={t("pages.proxies.form.server.title")}
					subtitle={t("pages.proxies.form.server.description")}
					rightContent={
						<Stack gap={theme.spacing(LAYOUT.MD)}>
							<FormSelectField
								name="protocol"
								fieldLabel={t("pages.proxies.form.server.option.protocol.label")}
								options={protocolOptions}
							/>
							<FormTextField
								name="host"
								fieldLabel={t("pages.proxies.form.server.option.host.label")}
								placeholder={t("pages.proxies.form.server.option.host.placeholder")}
							/>
							<FormNumberField
								name="port"
								fieldLabel={t("pages.proxies.form.server.option.port.label")}
							/>
						</Stack>
					}
				/>

				<ConfigBox
					title={t("pages.proxies.form.auth.title")}
					subtitle={t("pages.proxies.form.auth.description")}
					rightContent={
						<Stack gap={theme.spacing(LAYOUT.MD)}>
							{(isUsernameSet === false || usernameHasBeenReset === true) && (
								<FormTextField
									name="username"
									fieldLabel={t("pages.proxies.form.auth.option.username.label")}
									placeholder={t("pages.proxies.form.auth.option.username.placeholder")}
								/>
							)}

							{isUsernameSet === true && usernameHasBeenReset === false && (
								<Box>
									<FieldLabel>
										{t("pages.proxies.form.auth.option.username.labelSet")}
									</FieldLabel>
									<Button
										onClick={handleResetUsername}
										variant="contained"
										color="error"
									>
										{t("common.buttons.reset")}
									</Button>
								</Box>
							)}

							{(isPasswordSet === false || passwordHasBeenReset === true) && (
								<FormTextField
									name="password"
									type="password"
									fieldLabel={t("pages.proxies.form.auth.option.password.label")}
								/>
							)}

							{isPasswordSet === true && passwordHasBeenReset === false && (
								<Box>
									<FieldLabel>
										{t("pages.proxies.form.auth.option.password.labelSet")}
									</FieldLabel>
									<Button
										onClick={handleResetPassword}
										variant="contained"
										color="error"
									>
										{t("common.buttons.reset")}
									</Button>
								</Box>
							)}
						</Stack>
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

export default ProxiesCreatePage;
