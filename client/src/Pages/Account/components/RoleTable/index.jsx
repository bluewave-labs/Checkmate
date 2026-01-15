import Typography from "@mui/material/Typography";
import DataTable from "@/Components/v1/Table/index.jsx";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { useTranslation } from "react-i18next";
import { ROLES } from "../../../../Utils/roleUtils.js";

const RoleTable = ({ roles, handleDeleteRole }) => {
	const { t } = useTranslation();
	const HEADERS = [
		{
			id: "name",
			content: <Typography>{t("editUserPage.table.roleHeader")}</Typography>,
			render: (row) => {
				return row;
			},
		},
		{
			id: "delete",
			content: <Typography>{t("editUserPage.table.actionHeader")}</Typography>,
			render: (row) => {
				if (row === ROLES.SUPERADMIN) return null;
				return (
					<DeleteOutlineRoundedIcon
						onClick={() => {
							handleDeleteRole(row);
						}}
						sx={{ cursor: "pointer" }}
					/>
				);
			},
		},
	];
	return (
		<DataTable
			headers={HEADERS}
			data={roles}
		/>
	);
};

export default RoleTable;
