import { BasePage } from "@/components/design-elements";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { Table } from "@/components/design-elements";
import { HeaderCreate } from "@/components/common";
import type { Header } from "@/components/design-elements/Table";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useTheme } from "@mui/material/styles";
import { useParams } from "react-router";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { ITeamMember } from "@/types/team-member";

const TeamDetailsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { response } = useGet<ApiResponse<any>>(`/teams/${id}`);
  const { response: teamMembersResponse } = useGet<ApiResponse<any>>(
    `/team-members?teamId=${id}`
  );
  const team = response?.data;

  // Get all team members
  const teamMembers = teamMembersResponse?.data;

  const getHeaders = () => {
    const headers: Header<ITeamMember>[] = [
      {
        id: "name",
        content: t("common.table.headers.name"),
        render: (row) => {
          return row?.userId?.firstName + " " + row?.userId?.lastName;
        },
      },

      {
        id: "role",
        content: t("teams.details.table.headers.role"),
        render: (row) => {
          return row?.roleId?.name;
        },
      },
      {
        id: "permissions",
        content: t("teams.details.table.headers.permissions"),
        render: (row) => {
          return (
            <Stack>
              {row?.roleId?.permissions.map((permission) => (
                <Typography key={permission}>{permission}</Typography>
              ))}
            </Stack>
          );
        },
      },
    ];
    return headers;
  };

  const headers = getHeaders();

  return (
    <BasePage>
      <Stack>
        <Stack alignItems="baseline" direction="row" gap={theme.spacing(2)}>
          <Typography variant="h2">
            {`${t("teams.details.infoHeader.name")}:`}{" "}
          </Typography>
          <Typography>{team?.name}</Typography>
        </Stack>
        <Stack alignItems="baseline" direction="row" gap={theme.spacing(2)}>
          <Typography variant="h2">
            {`${t("teams.details.infoHeader.description")}:`}{" "}
          </Typography>
          <Typography>{team?.description}</Typography>
        </Stack>
      </Stack>
      <HeaderCreate
        label="Add new team member"
        path={`/teams/${id}/member/create`}
        isLoading={false}
        entitlement={null}
        entitlementCount={teamMembers?.length || 0}
      />
      <Typography variant="h2" marginTop={theme.spacing(4)}>
        {t("teams.details.table.title")}
      </Typography>
      <Table
        headers={headers}
        data={teamMembers || []}
        onRowClick={(row) => {
          navigate(`/teams/${id}/member/${row._id}/configure`);
        }}
      />
    </BasePage>
  );
};

export default TeamDetailsPage;
