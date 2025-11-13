import { BasePage, InfoBox } from "@/components/design-elements";
import { ProfileForm } from "@/pages/profile/ProfileForm";

import { useState, useEffect } from "react";
import type { IUser } from "@/types/user";
import type { ApiResponse } from "@/hooks/UseApi";
import { useGet, usePatch } from "@/hooks/UseApi";
import { z } from "zod";
import { profileSchema } from "@/validation/zod";
type FormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const { response, loading } = useGet<ApiResponse<any>>(`/profile`, {}, {});
  useEffect(() => {
    if (response?.data) setUser(response.data);
  }, [response]);

  const { patch, loading: isPatching } = usePatch<FormValues, Partial<IUser>>();

  const onSubmit = async (data: FormValues) => {
    const res = await patch(`/profile`, data);
    if (res) {
      setUser(res.data);
    }
  };
  const initialData = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  };

  return (
    <BasePage>
      <InfoBox
        title="View and edit your profile"
        description="You can set your name and password here"
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
