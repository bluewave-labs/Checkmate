import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import { Table } from "@/components/design-elements";
import type { Header } from "@/components/design-elements/Table";
import { useGet } from "@/hooks/UseApi";
import { useAppSelector } from "@/hooks/AppHooks";
import type { Entitlements } from "@/types/entitlements";
import { config } from "@/config/index";

type PermissionsResponse = {
  message: string;
  data: {
    org: string[];
    team: { teamId: string; permission: string }[];
  };
};

type EntitlementRow = { id?: string | number; key: string; value: any };
type PermissionRow = {
  id?: string | number;
  scope: "org" | "team";
  team?: string;
  permission: string;
};

export default function DiagnosticsAccessTab() {
  const theme = useTheme();
  const user = useAppSelector((s: any) => s.auth?.user);
  const selectedTeamId = useAppSelector((s: any) => s.auth?.selectedTeamId);
  const { response: permsRes } = useGet<PermissionsResponse>(
    "/me/permissions",
    {},
    { refreshInterval: config.GLOBAL_REFRESH },
    { useTeamIdAsKey: true }
  );
  const { response: entsRes } = useGet<{ message: string; data: Entitlements }>(
    "/me/entitlements",
    {},
    { refreshInterval: config.GLOBAL_REFRESH },
    { useTeamIdAsKey: true }
  );

  const orgPerms = permsRes?.data?.org || [];
  const teamPerms = permsRes?.data?.team || [];

  const entitlementsObj = entsRes?.data as Entitlements | undefined;
  const entitlements: EntitlementRow[] = entitlementsObj
    ? (Object.entries(entitlementsObj) as [keyof Entitlements, any][]).map(
        ([key, value]) => ({ id: String(key), key: String(key), value })
      )
    : [];

  const renderValue = (val: unknown): string => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "number") return String(val);
    if (typeof val === "string") return val;
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  };

  const teamIdToName = new Map<string, string>(
    (Array.isArray(user?.teams) ? user?.teams : []).map((t: any) => [
      String(t?.id ?? t?._id ?? ""),
      String(t?.name ?? t?.id ?? t?._id ?? "unknown"),
    ])
  );
  const permissionRows: PermissionRow[] = [
    ...orgPerms.map((p, idx) => ({
      id: `org-${idx}-${String(p)}`,
      scope: "org" as const,
      team: "-",
      permission: String(p),
    })),
    ...teamPerms.map((tp, idx) => ({
      id: `team-${idx}-${String(tp?.teamId ?? idx)}-${String(tp?.permission)}`,
      scope: "team" as const,
      team: teamIdToName.get(String(tp?.teamId)) ?? String(tp?.teamId ?? "-"),
      permission: String(tp?.permission),
    })),
  ];

  const permHeaders: Header<PermissionRow>[] = [
    { id: "scope", content: "Scope", render: (r) => r.scope },
    { id: "team", content: "Team", render: (r) => r.team ?? "-" },
    { id: "permission", content: "Permission", render: (r) => r.permission },
  ];

  const entHeaders: Header<EntitlementRow>[] = [
    { id: "key", content: "Entitlement", render: (r) => r.key },
    { id: "value", content: "Value", render: (r) => renderValue(r.value) },
  ];

  const clientOrgPermsArr: string[] = Array.isArray(user?.org?.permissions)
    ? (user?.org?.permissions as any[]).map((p) => String(p))
    : [];
  const clientTeamsArr: any[] = Array.isArray(user?.teams)
    ? user?.teams.filter(
        (t: any) =>
          String(t?.id ?? t?._id ?? "") === String(selectedTeamId ?? "")
      )
    : [];

  const clientEntitlementsObj = (user?.entitlements || {}) as Record<
    string,
    unknown
  >;
  const clientEntitlements: EntitlementRow[] = Object.entries(
    clientEntitlementsObj
  ).map(([key, value]) => ({ id: key, key, value }));

  const clientPermissionRows: PermissionRow[] = [
    ...clientOrgPermsArr.map((p, idx) => ({
      id: `c-org-${idx}-${p}`,
      scope: "org" as const,
      team: "-",
      permission: p,
    })),
    ...clientTeamsArr.flatMap((t) => {
      const perms = t?.permissions;
      if (Array.isArray(perms))
        return perms.map((p: any, i: number) => ({
          id: `c-team-${t?.id}-${i}-${String(p)}`,
          scope: "team" as const,
          team: String(t?.name ?? t?.id ?? "unknown"),
          permission: String(p),
        }));
      if (typeof perms === "string")
        return [
          {
            id: `c-team-${t?.id}-0-${String(perms)}`,
            scope: "team" as const,
            team: String(t?.name ?? t?.id ?? "unknown"),
            permission: String(perms),
          },
        ];
      return [];
    }),
  ];

  const clientPermHeaders: Header<PermissionRow>[] = [
    { id: "scope", content: "Scope", render: (r) => r.scope },
    { id: "team", content: "Team", render: (r) => r.team ?? "-" },
    { id: "permission", content: "Permission", render: (r) => r.permission },
  ];

  return (
    <Stack spacing={theme.spacing(8)}>
      <Stack spacing={theme.spacing(3)}>
        <Typography variant="h1">Server permissions</Typography>
        <Table headers={permHeaders} data={permissionRows} />
      </Stack>

      <Stack spacing={theme.spacing(3)}>
        <Typography variant="h1">Server entitlements</Typography>
        <Table headers={entHeaders} data={entitlements} />
      </Stack>

      <Divider />

      <Stack spacing={theme.spacing(3)}>
        <Typography variant="h1">Client permissions</Typography>
        <Table headers={clientPermHeaders} data={clientPermissionRows} />
      </Stack>

      <Stack spacing={theme.spacing(3)}>
        <Typography variant="h1">Client entitlements</Typography>
        <Table headers={entHeaders} data={clientEntitlements} />
      </Stack>
    </Stack>
  );
}
