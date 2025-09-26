import { useSelector } from "react-redux";
import { lightTheme, darkTheme } from "@/Utils/Theme/v2/theme";
import { Navigate, Route, Routes as LibRoutes } from "react-router";
import { ThemeProvider } from "@emotion/react";
import HomeLayout from "../Components/Layouts/HomeLayout";
import NotFound from "../Pages/v1/NotFound";
// Auth
import AuthLogin from "../Pages/v1/Auth/Login";
import AuthLoginV2 from "@/Pages/v2/Auth/Login";
import AuthRegister from "../Pages/v1/Auth/Register/";
import AuthRegisterV2 from "@/Pages/v2/Auth/Register";
import AuthForgotPassword from "../Pages/v1/Auth/ForgotPassword";
import AuthCheckEmail from "../Pages/v1/Auth/CheckEmail";
import AuthSetNewPassword from "../Pages/v1/Auth/SetNewPassword";
import AuthNewPasswordConfirmed from "../Pages/v1/Auth/NewPasswordConfirmed";

// Uptime
import Uptime from "../Pages/v1/Uptime/Monitors";
import UptimeDetails from "../Pages/v1/Uptime/Details";
import UptimeCreate from "../Pages/v1/Uptime/Create";

// PageSpeed
import PageSpeed from "../Pages/v1/PageSpeed/Monitors";
import PageSpeedDetails from "../Pages/v1/PageSpeed/Details";
import PageSpeedCreate from "../Pages/v1/PageSpeed/Create";

// Infrastructure
import Infrastructure from "../Pages/v1/Infrastructure/Monitors";
import InfrastructureCreate from "../Pages/v1/Infrastructure/Create";
import InfrastructureDetails from "../Pages/v1/Infrastructure/Details";

// Server Status
import ServerUnreachable from "../Pages/v1/ServerUnreachable.jsx";

// Incidents
import Incidents from "../Pages/v1/Incidents";

// Status pages
import CreateStatus from "../Pages/v1/StatusPage/Create";
import StatusPages from "../Pages/v1/StatusPage/StatusPages";
import Status from "../Pages/v1/StatusPage/Status";

import Notifications from "../Pages/v1/Notifications";
import CreateNotifications from "../Pages/v1/Notifications/create";

// Settings
import Account from "../Pages/v1/Account";
import EditUser from "../Pages/v1/Account/EditUser";
import Settings from "../Pages/v1/Settings";

import Maintenance from "../Pages/v1/Maintenance";

import ProtectedRoute from "../Components/ProtectedRoute";
import RoleProtectedRoute from "../Components/RoleProtectedRoute";
import CreateNewMaintenanceWindow from "../Pages/v1/Maintenance/CreateMaintenance";
import withAdminCheck from "../Components/HOC/withAdminCheck";
import BulkImport from "../Pages/v1/Uptime/BulkImport";
import Logs from "../Pages/v1/Logs";

const Routes = () => {
	const mode = useSelector((state) => state.ui.mode);
	const v2Theme = mode === "light" ? lightTheme : darkTheme;
	const AdminCheckedRegister = withAdminCheck(AuthRegister);
	return (
		<LibRoutes>
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<HomeLayout />
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

				<Route
					path="/uptime/bulk-import"
					element={<BulkImport />}
				/>

				<Route
					path="/uptime/create"
					element={<UptimeCreate />}
				/>
				<Route
					path="/uptime/create/:monitorId"
					element={<UptimeCreate isClone={true} />}
				/>
				<Route
					path="/uptime/:monitorId/"
					element={<UptimeDetails />}
				/>
				<Route
					path="/uptime/configure/:monitorId/"
					element={<UptimeCreate />}
				/>

				<Route
					path="pagespeed"
					element={<PageSpeed />}
				/>
				<Route
					path="pagespeed/create"
					element={<PageSpeedCreate />}
				/>
				<Route
					path="pagespeed/:monitorId"
					element={<PageSpeedDetails />}
				/>
				<Route
					path="pagespeed/configure/:monitorId"
					element={<PageSpeedCreate />}
				/>
				<Route
					path="infrastructure"
					element={<Infrastructure />}
				/>
				<Route
					path="infrastructure/create"
					element={<InfrastructureCreate />}
				/>
				<Route
					path="/infrastructure/configure/:monitorId"
					element={<InfrastructureCreate />}
				/>
				<Route
					path="infrastructure/:monitorId"
					element={<InfrastructureDetails />}
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
					path="status/uptime/:url"
					element={<Status />}
				/>

				<Route
					path="status/uptime/create"
					element={<CreateStatus />}
				/>

				<Route
					path="status/uptime/configure/:url"
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
					path="notifications/:notificationId"
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
				element={<AuthLogin />}
			/>
			<Route
				path="/v2/login"
				element={
					<ThemeProvider theme={v2Theme}>
						<AuthLoginV2 />
					</ThemeProvider>
				}
			/>

			<Route
				path="/register"
				element={<AdminCheckedRegister />}
			/>
			<Route
				path="/v2/register"
				element={
					<ThemeProvider theme={v2Theme}>
						<AuthRegisterV2 />
					</ThemeProvider>
				}
			/>

			<Route
				exact
				path="/register/:token"
				element={<AuthRegister superAdminExists={true} />}
			/>

			<Route
				path="/forgot-password"
				element={<AuthForgotPassword />}
			/>
			<Route
				path="/check-email"
				element={<AuthCheckEmail />}
			/>
			<Route
				path="/set-new-password/:token"
				element={<AuthSetNewPassword />}
			/>
			<Route
				path="/new-password-confirmed"
				element={<AuthNewPasswordConfirmed />}
			/>
			<Route
				path="/status/uptime/public/:url"
				element={<Status />}
			/>

			<Route
				path="/server-unreachable"
				element={<ServerUnreachable />}
			/>
			<Route
				path="*"
				element={<NotFound />}
			/>
		</LibRoutes>
	);
};

export { Routes };
