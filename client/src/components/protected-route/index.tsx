import { useAppSelector } from "@/hooks/AppHooks";
import { Navigate } from "react-router";

export const ProtectedRoute: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
