import { Navigate, Route, Routes as LibRoutes } from "react-router";
import RootLayout from "@/Components/layout/RootLayout";
import NotFound from "@/Pages/NotFound";

// Auth
import AuthLogin from "@/Pages/Auth/Login";
import AuthRegister from "@/Pages/Auth/Register";
import AuthForgotPassword from "@/Pages/Auth/Recovery";
import AuthSetNewPassword from "@/Pages/Auth/SetNewPassword";

// Uptime
import Uptime from "@/Pages/Uptime/Monitors";
import UptimeDetails from "@/Pages/Uptime/Details";

// PageSpeed
import PageSpeed from "@/Pages/PageSpeed/Monitors/";
import PageSpeedDetails from "@/Pages/PageSpeed/Details/";

// Infrastructure
import Infrastructure from "@/Pages/Infrastructure/Monitors";
import InfrastructureDetails from "@/Pages/Infrastructure/Details";

// Checks
import Checks from "@/Pages/Checks";

// Incidents
import Incidents from "@/Pages/Incidents";

// Status pages
import CreateStatus from "@/Pages/StatusPage/Create/";
import StatusPages from "@/Pages/StatusPage/StatusPages";
import Status from "@/Pages/StatusPage/Status";

import Notifications from "@/Pages/Notifications";
import CreateNotifications from "@/Pages/Notifications/create";

// Settings
import Account from "@/Pages/Account";
import EditUser from "@/Pages/Account/EditUser";
import Settings from "@/Pages/Settings";

import Maintenance from "@/Pages/Maintenance";
import CreateNewMaintenanceWindow from "@/Pages/Maintenance/create";

// Logs & Diagnostics
import Logs from "@/Pages/Logs";

// Routing
import { ProtectedRoute, RoleProtectedRoute } from "@/Components/routing/RouteProtected";

import CreateMonitor from "@/Pages/CreateMonitor";

const Routes = () => {
	return (
		<LibRoutes>
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<RootLayout />
					</ProtectedRoute>
				}
			>
				<Route
					path="/"
					element={<Navigate to="/uptime" />}
				/>
				<Route
					path="/uptime"
					element={<Uptime />}
				/>

				<Route path="/uptime/bulk-import" />

				<Route
					path="/uptime/create"
					element={<CreateMonitor />}
				/>
				<Route
					path="/uptime/:monitorId/"
					element={<UptimeDetails />}
				/>
				<Route
					path="/uptime/configure/:monitorId/"
					element={<CreateMonitor />}
				/>

				<Route
					path="pagespeed"
					element={<PageSpeed />}
				/>
				<Route
					path="pagespeed/create"
					element={<CreateMonitor />}
				/>
				<Route
					path="pagespeed/:monitorId"
					element={<PageSpeedDetails />}
				/>
				<Route
					path="pagespeed/configure/:monitorId"
					element={<CreateMonitor />}
				/>
				<Route
					path="infrastructure"
					element={<Infrastructure />}
				/>
				<Route
					path="infrastructure/create"
					element={<CreateMonitor />}
				/>
				<Route
					path="/infrastructure/configure/:monitorId"
					element={<CreateMonitor />}
				/>
				<Route
					path="infrastructure/:monitorId"
					element={<InfrastructureDetails />}
				/>
				<Route
					path="checks/:monitorId?"
					element={<Checks />}
				/>
				<Route
					path="incidents/:monitorId?"
					element={<Incidents />}
				/>

				<Route
					path="status"
					element={<StatusPages />}
				/>

				<Route
					path="status/:url"
					element={<Status />}
				/>

				<Route
					path="status/create"
					element={<CreateStatus />}
				/>

				<Route
					path="status/configure/:url"
					element={<CreateStatus />}
				/>

				<Route
					path="notifications"
					element={<Notifications />}
				/>
				<Route
					path="notifications/create"
					element={<CreateNotifications />}
				/>

				<Route
					path="notifications/configure/:notificationId"
					element={<CreateNotifications />}
				/>

				<Route
					path="maintenance"
					element={<Maintenance />}
				/>
				<Route
					path="/maintenance/create/:maintenanceWindowId?"
					element={<CreateNewMaintenanceWindow />}
				/>
				<Route
					path="settings"
					element={<Settings />}
				/>

				<Route
					path="account/profile"
					element={<Account open={"profile"} />}
				/>
				<Route
					path="account/password"
					element={<Account open={"password"} />}
				/>
				<Route
					path="account/team"
					element={<Account open={"team"} />}
				/>
				<Route
					path="account/team/:userId"
					element={
						<RoleProtectedRoute roles={["superadmin"]}>
							<EditUser />
						</RoleProtectedRoute>
					}
				/>

				<Route
					path="logs"
					element={
						<RoleProtectedRoute roles={["admin", "superadmin"]}>
							<Logs />
						</RoleProtectedRoute>
					}
				/>
			</Route>

			<Route
				path="/login"
				element={
					<>
						<AuthLogin />
					</>
				}
			/>

			<Route
				path="/register"
				element={<AuthRegister />}
			/>

			<Route
				path="/register/:token"
				element={<AuthRegister />}
			/>

			<Route
				path="/forgot-password"
				element={<AuthForgotPassword />}
			/>
			<Route
				path="/set-new-password/:token"
				element={<AuthSetNewPassword />}
			/>
			<Route
				path="/status/public/:url"
				element={<Status />}
			/>

			<Route
				path="*"
				element={<NotFound />}
			/>
		</LibRoutes>
	);
};

export { Routes };
