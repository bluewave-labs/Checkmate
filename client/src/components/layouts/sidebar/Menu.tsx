import {
  Bell,
  Monitor,
  Gauge,
  Server,
  AlertTriangle,
  LayoutList,
  ListChecks,
  Wrench,
  Activity,
  LifeBuoy,
  MessageSquare,
  FileText,
  ScrollText,
} from "lucide-react";
import type { IUser } from "@/types/user";

export const getMenu = (t: Function, user: IUser) => {
  const userOrgPermissions = user?.org?.permissions || [];
  const hasDiagnostics = userOrgPermissions.includes("master");

  return [
    {
      name: t("menu.uptime"),
      path: "uptime",
      icon: <Monitor size={20} strokeWidth={1.5} />,
    },
    {
      name: t("menu.pagespeed"),
      path: "pagespeed",
      icon: <Gauge size={20} strokeWidth={1.5} />,
    },

    {
      name: t("menu.infrastructure"),
      path: "infrastructure",
      icon: <Server size={20} strokeWidth={1.5} />,
    },
    {
      name: t("menu.notifications"),
      path: "notification-channels",
      icon: <Bell size={20} strokeWidth={1.5} />,
    },
    {
      name: t("menu.incidents"),
      path: "incidents",
      icon: <AlertTriangle size={20} strokeWidth={1.5} />,
    },
    {
      name: t("menu.checks"),
      path: "checks",
      icon: <ListChecks size={20} strokeWidth={1.5} />,
    },

    {
      name: t("menu.statusPages"),
      path: "status-pages",
      icon: <LayoutList size={20} strokeWidth={1.5} />,
    },
    {
      name: t("menu.maintenance"),
      path: "maintenance",
      icon: <Wrench size={20} strokeWidth={1.5} />,
    },
    ...(hasDiagnostics
      ? [
          {
            name: t("menu.diagnostics"),
            path: "diagnostics",
            icon: <Activity size={20} strokeWidth={1.5} />,
          },
        ]
      : []),
  ];
};

export const getBottomMenu = (t: Function) => [
  {
    name: t("menu.support"),
    path: "support",
    icon: <LifeBuoy size={20} strokeWidth={1.5} />,
    url: "https://discord.com/invite/NAb6H3UTjK",
  },
  {
    name: t("menu.discussions"),
    path: "discussions",
    icon: <MessageSquare size={20} strokeWidth={1.5} />,
    url: "https://github.com/bluewave-labs/checkmate/discussions",
  },
  {
    name: t("menu.docs"),
    path: "docs",
    icon: <FileText size={20} strokeWidth={1.5} />,
    url: "https://bluewavelabs.gitbook.io/checkmate",
  },
  {
    name: t("menu.changelog"),
    path: "changelog",
    icon: <ScrollText size={20} strokeWidth={1.5} />,
    url: "https://github.com/bluewave-labs/checkmate/releases",
  },
];
