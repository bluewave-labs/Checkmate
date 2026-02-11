// Temp v2 theme
import { ThemeProvider } from "@mui/material";
import { lightTheme, darkTheme } from "@/Utils/Theme/v2Theme";

import { useSelector } from "react-redux";
import { Navigate, Route, Routes as LibRoutes } from "react-router";
import RootLayout from "@/Components/v2/layout/RootLayout";
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
import {
	ProtectedRoute,
	RoleProtectedRoute,
} from "@/Components/v2/routing/RouteProtected";

import CreateMonitor from "@/Pages/CreateMonitor";

const Routes = () => {
	const mode = useSelector((state) => state.ui.mode);
	const v2theme = mode === "light" ? lightTheme : darkTheme;
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
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<Uptime />
							</ThemeProvider>
						</>
					}
				/>

				<Route path="/uptime/bulk-import" />

				<Route
					path="/uptime/create"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateMonitor />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="/uptime/:monitorId/"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<UptimeDetails />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="/uptime/configure/:monitorId/"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateMonitor />
							</ThemeProvider>
						</>
					}
				/>

				<Route
					path="pagespeed"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<PageSpeed />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="pagespeed/create"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateMonitor />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="pagespeed/:monitorId"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<PageSpeedDetails />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="pagespeed/configure/:monitorId"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateMonitor />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="infrastructure"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<Infrastructure />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="infrastructure/create"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateMonitor />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="/infrastructure/configure/:monitorId"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateMonitor />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="infrastructure/:monitorId"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<InfrastructureDetails />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="checks/:monitorId?"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<Checks />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="incidents/:monitorId?"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<Incidents />
							</ThemeProvider>
						</>
					}
				/>

				<Route
					path="status"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<StatusPages />
							</ThemeProvider>
						</>
					}
				/>

				<Route
					path="status/:url"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<Status />
							</ThemeProvider>
						</>
					}
				/>

				<Route
					path="status/create"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateStatus />
							</ThemeProvider>
						</>
					}
				/>

				<Route
					path="status/configure/:url"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateStatus />
							</ThemeProvider>
						</>
					}
				/>

				<Route
					path="notifications"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<Notifications />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="notifications/create"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateNotifications />
							</ThemeProvider>
						</>
					}
				/>

				<Route
					path="notifications/configure/:notificationId"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateNotifications />
							</ThemeProvider>
						</>
					}
				/>

				<Route
					path="maintenance"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<Maintenance />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="/maintenance/create/:maintenanceWindowId?"
					element={
						<>
							<ThemeProvider theme={v2theme}>
								<CreateNewMaintenanceWindow />
							</ThemeProvider>
						</>
					}
				/>
				<Route
					path="settings"
					element={<Settings />}
				/>
				<Route
					path="account/profile"
					element={
						<ThemeProvider theme={v2theme}>
							<Account open={"profile"} />
						</ThemeProvider>
					}
				/>
				<Route
					path="account/password"
					element={
						<ThemeProvider theme={v2theme}>
							<Account open={"password"} />
						</ThemeProvider>
					}
				/>
				<Route
					path="account/team"
					element={
						<ThemeProvider theme={v2theme}>
							<Account open={"team"} />
						</ThemeProvider>
					}
				/>
				<Route
					path="account/team/:userId"
					element={
						<RoleProtectedRoute roles={["superadmin"]}>
							<ThemeProvider theme={v2theme}>
								<EditUser />
							</ThemeProvider>
						</RoleProtectedRoute>
					}
				/>

				<Route
					path="logs"
					element={
						<RoleProtectedRoute roles={["admin", "superadmin"]}>
							<ThemeProvider theme={v2theme}>
								<Logs />
							</ThemeProvider>
						</RoleProtectedRoute>
					}
				/>
			</Route>

			<Route
				path="/login"
				element={
					<>
						<ThemeProvider theme={v2theme}>
							<AuthLogin />
						</ThemeProvider>
					</>
				}
			/>

			<Route
				path="/register"
				element={
					<>
						<ThemeProvider theme={v2theme}>
							<AuthRegister />
						</ThemeProvider>
					</>
				}
			/>

			<Route
				exact
				path="/register/:token"
				element={
					<>
						<ThemeProvider theme={v2theme}>
							<AuthRegister superAdminExists={true} />
						</ThemeProvider>
					</>
				}
			/>

			<Route
				path="/forgot-password"
				element={
					<>
						<ThemeProvider theme={v2theme}>
							<AuthForgotPassword />
						</ThemeProvider>
					</>
				}
			/>
			<Route
				path="/set-new-password/:token"
				element={
					<>
						<ThemeProvider theme={v2theme}>
							<AuthSetNewPassword />
						</ThemeProvider>
					</>
				}
			/>
			<Route
				path="/status/public/:url"
				element={
					<>
						<ThemeProvider theme={v2theme}>
							<Status />
						</ThemeProvider>
					</>
				}
			/>

			<Route
				path="*"
				element={
					<>
						<ThemeProvider theme={v2theme}>
							<NotFound />
						</ThemeProvider>
					</>
				}
			/>
		</LibRoutes>
	);
};

export { Routes };
