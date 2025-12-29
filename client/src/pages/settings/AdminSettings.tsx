import { BasePage } from "@/components/design-elements";

import { SettingsForm } from "@/pages/settings/SettingsForm";

import { useMemo } from "react";
import {} from "react-i18next";
import { useAppSelector } from "@/hooks/AppHooks";
import { useGet, usePatch, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/types/api";
import type { FormValues } from "@/pages/settings/SettingsForm";

const AdminSettingsPage = () => {
  const user = useAppSelector((state) => state.auth.user);

  const orgPermissions = user?.org?.permissions || [];
  const hasMaster = orgPermissions.includes("master");

  const { post, loading: posting } = usePost<Partial<FormValues>, any>();
  const { patch, loading: patching } = usePatch<Partial<FormValues>, any>();

  const { response, loading } = useGet<ApiResponse<any>>(
    hasMaster ? "/settings" : null
  );
  const settings = response?.data || {};
  const initialSettings = useMemo(() => settings, [settings]);

  const onSubmitEmail = async (data: Partial<FormValues>) => {
    const emailSettings = {
      systemEmailHost: data.systemEmailHost,
      systemEmailPort: data.systemEmailPort,
      systemEmailAddress: data.systemEmailAddress,
      systemEmailPassword: data.systemEmailPassword,
      systemEmailUser: data.systemEmailUser,
      systemEmailConnectionHost: data.systemEmailConnectionHost,
      systemEmailTLSServername: data.systemEmailTLSServername,
      systemEmailSecure: data.systemEmailSecure,
      systemEmailPool: data.systemEmailPool,
      systemEmailIgnoreTLS: data.systemEmailIgnoreTLS,
      systemEmailRequireTLS: data.systemEmailRequireTLS,
      systemEmailRejectUnauthorized: data.systemEmailRejectUnauthorized,
    };

    await patch("/settings/email", emailSettings);
  };

  const onSubmitRetention = async (data: Partial<FormValues>) => {
    const { checksRetentionDays } = data;
    await patch("/settings/retention", { checksRetentionDays });
  };

  const onTest = async (data: Partial<FormValues>) => {
    const emailSettings = {
      systemEmailHost: data.systemEmailHost,
      systemEmailPort: data.systemEmailPort,
      systemEmailAddress: data.systemEmailAddress,
      systemEmailPassword: data.systemEmailPassword,
      systemEmailUser: data.systemEmailUser,
      systemEmailConnectionHost: data.systemEmailConnectionHost,
      systemEmailTLSServername: data.systemEmailTLSServername,
      systemEmailSecure: data.systemEmailSecure,
      systemEmailPool: data.systemEmailPool,
      systemEmailIgnoreTLS: data.systemEmailIgnoreTLS,
      systemEmailRequireTLS: data.systemEmailRequireTLS,
      systemEmailRejectUnauthorized: data.systemEmailRejectUnauthorized,
    };
    await post("/settings/test-transport", emailSettings);
  };

  return (
    <BasePage>
      <SettingsForm
        onSubmitEmail={onSubmitEmail}
        onSubmitRetention={onSubmitRetention}
        onTest={onTest}
        initialData={initialSettings}
        loading={posting || loading || patching}
      />
    </BasePage>
  );
};

export default AdminSettingsPage;
