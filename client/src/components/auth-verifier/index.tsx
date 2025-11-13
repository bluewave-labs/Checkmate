import { useAppDispatch } from "@/hooks/AppHooks";
import type { ApiResponse } from "@/hooks/UseApi";
import type { IUser } from "@/types/user";
import {
  setAuthenticated,
  setUser,
  logout,
  setSelectedTeamId,
} from "@/features/authSlice";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/AppHooks";
import type { ReactNode } from "react";
import { get } from "@/utils/ApiClient";
import { useLocation } from "react-router-dom";
export const AuthVerifier = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const isAuthRoute =
    ["/login", "/register"].includes(location.pathname) ||
    location.pathname.startsWith("/recovery");
  const isPublicRoute = location.pathname.startsWith("/status-pages/public");

  const [isVerifying, setIsVerifying] = useState(true);
  const dispatch = useAppDispatch();
  const selectedTeamId = useAppSelector((state) => state.auth.selectedTeamId);

  useEffect(() => {
    if (isAuthRoute || isPublicRoute) {
      setIsVerifying(false);
      return;
    }
    const verify = async () => {
      try {
        const res = await get<ApiResponse<IUser>>("/auth/me");
        const user: IUser = res.data.data;
        dispatch(setAuthenticated(true));
        dispatch(setUser(user));

        if (
          !selectedTeamId ||
          !user.teams.find((t) => t.id === selectedTeamId)
        ) {
          dispatch(setSelectedTeamId(user.teams[0].id));
        }
      } catch (error) {
        console.error(error);
        dispatch(logout());
      } finally {
        setIsVerifying(false);
      }
    };
    verify();
  }, [dispatch]);

  if (isVerifying) return null;

  return <>{children}</>;
};
