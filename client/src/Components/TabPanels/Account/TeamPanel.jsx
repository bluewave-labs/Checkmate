import { useTheme } from "@emotion/react";
import TabPanel from "@mui/lab/TabPanel";
import { Button, ButtonGroup, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TextInput from "../../Inputs/TextInput";
import { newOrChangedCredentials } from "../../../Validation/validation";
import { networkService } from "../../../main";
import { createToast } from "../../../Utils/toastUtils";
import Select from "../../Inputs/Select";
import { GenericDialog } from "../../Dialog/genericDialog";
import DataTable from "../../Table/";
import { useGetInviteToken } from "../../../Hooks/inviteHooks";
/**
 * TeamPanel component manages the organization and team members,
 * providing functionalities like renaming the organization, managing team members,
 * and inviting new members.
 *
 * @returns {JSX.Element}
 */

const TeamPanel = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const SPACING_GAP = theme.spacing(12);

	const [toInvite, setToInvite] = useState({
		email: "",
		role: ["user"],
	});
	const [data, setData] = useState([]);
	const [members, setMembers] = useState([]);
	const [filter, setFilter] = useState("all");
	const [isDisabled, setIsDisabled] = useState(true);
	const [errors, setErrors] = useState({});
	const [isSendingInvite, setIsSendingInvite] = useState(false);

	const [getInviteToken, clearToken, isLoading, error, token] = useGetInviteToken();

	const headers = [
		{
			id: "name",
			content: t("teamPanel.table.name"),
			render: (row) => {
				return (
					<Stack>
						<Typography color={theme.palette.primary.contrastTextSecondary}>
							{row.firstName + " " + row.lastName}
						</Typography>
						<Typography>
							{t("teamPanel.table.created")}{" "}
							{new Date(row.createdAt).toLocaleDateString()}
						</Typography>
					</Stack>
				);
			},
		},
		{ id: "email", content: t("teamPanel.table.email"), render: (row) => row.email },
		{
			id: "role",
			content: t("teamPanel.table.role"),
			render: (row) => row.role,
		},
	];

	useEffect(() => {
		const fetchTeam = async () => {
			try {
				const response = await networkService.getAllUsers();
				setMembers(response.data.data);
			} catch (error) {
				createToast({
					body: error.message || "Error fetching team members.",
				});
			}
		};

		fetchTeam();
	}, []);

	useEffect(() => {
		const ROLE_MAP = {
			superadmin: t("roles.superAdmin"),
			admin: t("roles.admin"),
			user: t("roles.teamMember"),
			demo: t("roles.demoUser"),
		};
		let team = members;
		if (filter !== "all")
			team = members.filter((member) => {
				if (filter === "admin") {
					return member.role.includes("admin") || member.role.includes("superadmin");
				}
				return member.role.includes(filter);
			});

		team = team.map((member) => ({
			...member,
			id: member._id,
			role: member.role.map((role) => ROLE_MAP[role]).join(","),
		}));
		setData(team);
	}, [members, filter, t]);

	useEffect(() => {
		setIsDisabled(Object.keys(errors).length !== 0 || toInvite.email === "");
	}, [errors, toInvite.email]);
	const [isOpen, setIsOpen] = useState(false);

	const handleChange = (event) => {
		const { value } = event.target;
		const newEmail = value?.toLowerCase() || value;
		setToInvite((prev) => ({
			...prev,
			email: newEmail,
		}));

		const validation = newOrChangedCredentials.validate(
			{ email: newEmail },
			{ abortEarly: false }
		);

		setErrors((prev) => {
			const updatedErrors = { ...prev };

			if (validation.error) {
				updatedErrors.email = validation.error.details[0].message;
			} else {
				delete updatedErrors.email;
			}
			return updatedErrors;
		});
	};

	const handleGetToken = async () => {
		await getInviteToken({ email: toInvite.email, role: toInvite.role });
	};

	const handleInviteMember = async () => {
		if (!toInvite.email) {
			setErrors((prev) => ({ ...prev, email: "Email is required." }));
			return;
		}
		setIsSendingInvite(true);
		if (!toInvite.role.includes("user") || !toInvite.role.includes("admin"))
			setToInvite((prev) => ({ ...prev, role: ["user"] }));

		const { error } = newOrChangedCredentials.validate(
			{ email: toInvite.email },
			{
				abortEarly: false,
			}
		);

		if (error) {
			setErrors((prev) => ({ ...prev, email: error.details[0].message }));
			return;
		}

		try {
			await networkService.sendInvitationToken({
				email: toInvite.email,
				role: toInvite.role,
			});
			closeInviteModal();
			createToast({
				body: "Member invited. They will receive an email with details on how to create their account.",
			});
		} catch (error) {
			createToast({
				body: error?.response?.data?.msg || error.message || "Unknown error.",
			});
		} finally {
			setIsSendingInvite(false);
		}
	};

	const closeInviteModal = () => {
		setIsOpen(false);
		clearToken();
		setToInvite({ email: "", role: ["0"] });
		setErrors({});
	};

	return (
		<TabPanel
			className="team-panel table-container"
			value="team"
			sx={{
				"& h1": {
					color: theme.palette.primary.contrastTextTertiary,
				},
				"& .MuiTable-root .MuiTableBody-root .MuiTableCell-root, & .MuiTable-root p + p":
					{
						color: theme.palette.primary.contrastTextSecondary,
					},
			}}
		>
			<Stack
				component="form"
				noValidate
				spellCheck="false"
				gap={SPACING_GAP}
			>
				<Typography component="h1">{t("teamPanel.teamMembers")}</Typography>
				<Stack
					direction="row"
					justifyContent="space-between"
				>
					<Stack
						direction="row"
						alignItems="flex-end"
						gap={theme.spacing(6)}
						sx={{ fontSize: 14 }}
					>
						<ButtonGroup>
							<Button
								variant="group"
								filled={(filter === "all").toString()}
								onClick={() => setFilter("all")}
							>
								{t("teamPanel.filter.all")}
							</Button>
							<Button
								variant="group"
								filled={(filter === "admin").toString()}
								onClick={() => setFilter("admin")}
							>
								{t("roles.superAdmin")}
							</Button>
							<Button
								variant="group"
								filled={(filter === "user").toString()}
								onClick={() => setFilter("user")}
							>
								{t("teamPanel.filter.member")}
							</Button>
						</ButtonGroup>
					</Stack>
					<Button
						variant="contained"
						color="accent"
						onClick={() => setIsOpen(true)}
					>
						{t("teamPanel.inviteTeamMember")}
					</Button>
				</Stack>

				<DataTable
					headers={headers}
					data={data}
					config={{ emptyView: t("teamPanel.noMembers") }}
				/>
			</Stack>

			<GenericDialog
				title={t("teamPanel.inviteNewTeamMember")}
				description={t("teamPanel.inviteDescription")}
				open={isOpen}
				onClose={closeInviteModal}
				theme={theme}
			>
				<TextInput
					marginBottom={SPACING_GAP}
					type="email"
					id="input-team-member"
					placeholder={t("teamPanel.email")}
					value={toInvite.email}
					onChange={handleChange}
					error={errors.email ? true : false}
					helperText={t(errors.email)}
				/>
				<Select
					id="team-member-role"
					placeholder={t("teamPanel.selectRole")}
					isHidden={true}
					value={toInvite.role[0]}
					onChange={(event) =>
						setToInvite((prev) => ({
							...prev,
							role: [event.target.value],
						}))
					}
					items={[
						{ _id: "admin", name: t("roles.admin") },
						{ _id: "user", name: t("roles.teamMember") },
					]}
				/>
				{token && <Typography>{t("teamPanel.inviteLink")}</Typography>}
				{token && (
					<TextInput
						id="invite-token"
						value={token}
					/>
				)}
				<Stack
					direction="row"
					gap={theme.spacing(4)}
					mt={theme.spacing(8)}
					justifyContent="flex-end"
				>
					<Button
						loading={isSendingInvite}
						variant="contained" // CAIO_REVIEW
						color="error"
						onClick={closeInviteModal}
					>
						{t("teamPanel.cancel")}
					</Button>
					<Button
						variant="contained"
						color="accent"
						onClick={handleGetToken}
						loading={isSendingInvite}
						disabled={isDisabled}
					>
						{t("teamPanel.getToken")}
					</Button>
					<Button
						variant="contained"
						color="accent"
						onClick={handleInviteMember}
						loading={isSendingInvite}
						disabled={isDisabled}
					>
						{t("teamPanel.emailToken")}
					</Button>
				</Stack>
			</GenericDialog>
		</TabPanel>
	);
};

TeamPanel.propTypes = {
	// No props are being passed to this component, hence no specific PropTypes are defined.
};

export default TeamPanel;
