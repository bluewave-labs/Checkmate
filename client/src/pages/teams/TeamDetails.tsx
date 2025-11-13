import { BasePage } from "@/components/design-elements";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { Table } from "@/components/design-elements";
import { HeaderCreate } from "@/components/teams/HeaderCreate";
import type { Header } from "@/components/design-elements/Table";

import { useNavigate } from "react-router";
import { useTheme } from "@mui/material/styles";
import { useParams } from "react-router";
import { useGet } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import type { ITeamMember } from "@/types/team-member";

const TeamDetailsPage = () => {
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
        content: "Name",
        render: (row) => {
          return row?.userId?.firstName + " " + row?.userId?.lastName;
        },
      },

      {
        id: "role",
        content: "Role",
        render: (row) => {
          return row?.roleId?.name;
        },
      },
      {
        id: "permissions",
        content: "Permissions",
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
          <Typography variant="h2">{"Name:"} </Typography>
          <Typography>{team?.name}</Typography>
        </Stack>
        <Stack alignItems="baseline" direction="row" gap={theme.spacing(2)}>
          <Typography variant="h2">{"Description:"} </Typography>
          <Typography>{team?.description}</Typography>
        </Stack>
      </Stack>
      <HeaderCreate
        label="Add new team member"
        path={`/teams/${id}/member/create`}
        isLoading={false}
      />
      <Typography variant="h2" marginTop={theme.spacing(4)}>
        Team Members
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
