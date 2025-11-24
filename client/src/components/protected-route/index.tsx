import { useAppSelector } from "@/hooks/AppHooks";
import { Navigate } from "react-router";

export const ProtectedRoute: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
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
