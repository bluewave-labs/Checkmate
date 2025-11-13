import { Routes, Route } from "react-router";
import AuthLogin from "@/pages/auth/Login";
import AuthRegister from "@/pages/auth/Register";
import AuthRegisterInvite from "@/pages/auth/RegisterInvite";
import UptimeMonitorsPage from "@/pages/uptime/UptimeMonitors";
import UptimeCreatePage from "@/pages/uptime/UptimeCreate";
import UptimeDetailsPage from "@/pages/uptime/UptimeDetails";
import UptimeConfigurePage from "@/pages/uptime/UptimeConfigure";
import SettingsPage from "@/pages/settings/Settings";
import TeamsPage from "@/pages/teams/Teams";
import TeamsCreatePage from "@/pages/teams/TeamsCreate";
import TeamsConfigPage from "@/pages/teams/TeamsConfig";
import TeamDetailsPage from "@/pages/teams/TeamDetails";
import TeamMemberConfigPage from "@/pages/teams/TeamMemberConfig";
import TeamMemberCreatePage from "@/pages/teams/TeamMemberCreate";
import InvitePage from "@/pages/auth/Invite";
import NotificationChannelsPage from "@/pages/notification-channels/NotificationChannels";
import NotificationChannelsCreatePage from "@/pages/notification-channels/NotificationChannelsCreate";
import NotificationChannelsConfigPage from "@/pages/notification-channels/NotificationChannelsConfig";
import IncidentsPage from "@/pages/incidents/IncidentsPage";
import PageSpeedMonitorsPage from "@/pages/pagespeed/PageSpeedMonitors";
import PageSpeedDetailsPage from "@/pages/pagespeed/PageSpeedDetails";
import PageSpeedConfigurePage from "@/pages/pagespeed/PageSpeedConfig";
import PageSpeedCreatePage from "@/pages/pagespeed/PageSpeedCreate";

import InfraMonitorsPage from "@/pages/infrastructure/InfraMonitors";
import InfraDetailsPage from "@/pages/infrastructure/InfraDetails";
import InfraConfigurePage from "@/pages/infrastructure/InfraConfig";
import InfraCreatePage from "@/pages/infrastructure/InfraCreate";

import MaintenancePage from "@/pages/maintenance/Maintenance";
import MaintenanceConfigPage from "@/pages/maintenance/MaintenanceConfig";
import MaintenanceCreatePage from "@/pages/maintenance/MaintenanceCreate";

import StatusPages from "@/pages/status-page/StatusPages";
import StatusDetailsPages from "@/pages/status-page/StatusPageDetails";
import StatusPublicPage from "@/pages/status-page/StatusPagePublic";
import StatusCreatePage from "@/pages/status-page/StatusPageCreate";
import StatusConfigPage from "@/pages/status-page/StatusPageConfig";

import DiagnosticPage from "@/pages/diagnostic/DiagnosticPage";

import RecoveryPage from "@/pages/recovery/Recovery";
import ResetPage from "@/pages/recovery/Reset";

import ProfilePage from "@/pages/profile/Profile";

import RootLayout from "@/components/layouts/RootLayout";
import { ProtectedRoute } from "@/components/protected-route";

const Router = () => {
  return (
    <Routes>
      <Route path="login" element={<AuthLogin />} />
      <Route path="register/:id" element={<AuthRegisterInvite />} />
      <Route path="register" element={<AuthRegister />} />
      <Route path="status-pages/public/:url/" element={<StatusPublicPage />} />
      <Route path="recovery/:id" element={<ResetPage />} />
      <Route path="recovery" element={<RecoveryPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UptimeMonitorsPage />} />
        <Route path="uptime/create" element={<UptimeCreatePage />} />
        <Route path="uptime/:id/configure" element={<UptimeConfigurePage />} />
        <Route path="uptime/:id" element={<UptimeDetailsPage />} />
        <Route path="uptime" element={<UptimeMonitorsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="teams/create" element={<TeamsCreatePage />} />
        <Route
          path="teams/:id/member/:memberId/configure"
          element={<TeamMemberConfigPage />}
        />
        <Route
          path="teams/:id/member/create"
          element={<TeamMemberCreatePage />}
        />
        <Route path="teams/:id/configure" element={<TeamsConfigPage />} />
        <Route path="teams/:id" element={<TeamDetailsPage />} />
        <Route path="teams" element={<TeamsPage />} />

        <Route path="invite" element={<InvitePage />} />
        <Route
          path="notification-channels/:id/configure"
          element={<NotificationChannelsConfigPage />}
        />
        <Route
          path="notification-channels/create"
          element={<NotificationChannelsCreatePage />}
        />
        <Route
          path="notification-channels"
          element={<NotificationChannelsPage />}
        />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="incidents/:id" element={<IncidentsPage />} />
        <Route path="pagespeed/create" element={<PageSpeedCreatePage />} />
        <Route
          path="pagespeed/:id/configure"
          element={<PageSpeedConfigurePage />}
        />
        <Route path="pagespeed/:id" element={<PageSpeedDetailsPage />} />
        <Route path="pagespeed" element={<PageSpeedMonitorsPage />} />
        <Route path="infrastructure/create" element={<InfraCreatePage />} />
        <Route
          path="infrastructure/:id/configure"
          element={<InfraConfigurePage />}
        />
        <Route path="infrastructure/:id" element={<InfraDetailsPage />} />
        <Route path="infrastructure" element={<InfraMonitorsPage />} />

        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="maintenance/create" element={<MaintenanceCreatePage />} />
        <Route
          path="maintenance/:id/configure"
          element={<MaintenanceConfigPage />}
        />
        <Route path="status-pages/:id" element={<StatusDetailsPages />} />
        <Route path="status-pages" element={<StatusPages />} />
        <Route path="status-pages/create" element={<StatusCreatePage />} />
        <Route
          path="status-pages/:id/configure"
          element={<StatusConfigPage />}
        />

        <Route path="diagnostics" element={<DiagnosticPage />} />

        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
};

export default Router;
