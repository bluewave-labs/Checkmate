import { BasePage, InfoBox } from "@/components/design-elements";
import { ProfileForm } from "@/pages/profile/ProfileForm";

import { useState, useEffect } from "react";
import type { IUser } from "@/types/user";
import type { ApiResponse } from "@/hooks/UseApi";
import { useGet, usePatch, useGetOnDemand } from "@/hooks/UseApi";
import { z } from "zod";
import { profileSchema } from "@/validation/zod";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/hooks/AppHooks";
import { setUser as setUserGlobal } from "@/features/authSlice";
type FormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const { response, loading } = useGet<ApiResponse<any>>(`/profile`, {}, {});
  const { get: getOnDemand } = useGetOnDemand<IUser>();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (response?.data) setUser(response.data);
  }, [response]);

  const { patch, loading: isPatching } = usePatch<FormValues, Partial<IUser>>();

  const onSubmit = async (data: FormValues) => {
    const res = await patch(`/profile`, data);
    if (res) {
      const me = await getOnDemand("/me");
      if (me?.data) {
        setUser(me.data);
        dispatch(setUserGlobal(me.data as IUser));
      }
    }
  };
  const initialData = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  };

  return (
    <BasePage>
      <InfoBox
        title={t("profile.infoBox.title")}
        description={t("profile.infoBox.description")}
      />
      <ProfileForm
        user={user}
        onSubmit={onSubmit}
        loading={loading || isPatching}
        initialData={initialData}
      />
    </BasePage>
  );
};

export default Profile;
