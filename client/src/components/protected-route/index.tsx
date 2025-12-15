import { useAppSelector } from "@/hooks/AppHooks";
import { Navigate } from "react-router";
import NotFound from "@/pages/errors/NotFound";

export const ProtectedRoute = ({ children }: React.PropsWithChildren) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.teams.length === 0) {
    return <Navigate to="/no-team" replace />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export const MasterRoute = ({ children }: React.PropsWithChildren) => {
  const user = useAppSelector((state) => state.auth.user);

  if (user?.teams.length === 0) {
    return <Navigate to="/no-team" replace />;
  }

  const perms: string[] = (user?.org?.permissions || []).map((p: any) =>
    (p ?? "").toString().trim().toLowerCase()
  );
  const hasMaster = perms.includes("master");

  if (!hasMaster) {
    return <NotFound />;
  }

  return <>{children}</>;
};
