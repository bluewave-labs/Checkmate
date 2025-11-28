import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { BasePage, ConfigBox } from "@/components/design-elements";
import {
  AutoComplete,
  Select,
  LanguageSelector,
  Button,
  RadioWithDescription,
  Dialog,
} from "@/components/inputs";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { SettingsForm } from "@/pages/settings/SettingsForm";
import DummyChart from "@/pages/settings/DummyChart";

import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { setTimezone, setMode, setChartType } from "@/features/uiSlice";
import { useAppSelector, useAppDispatch } from "@/hooks/AppHooks";
import timezones from "@/utils/timezones.json";
import type { ITimeZone } from "@/types/timezone";
import { useGet, usePatch, usePost } from "@/hooks/UseApi";
import type { ApiResponse } from "@/hooks/UseApi";
import { z } from "zod";
import { systemSettingsSchema } from "@/validation/zod";

const AdminSettingsPage = () => {
  type FormValues = z.infer<typeof systemSettingsSchema>;

  const user = useAppSelector((state) => state.auth.user);

  const orgPermissions = user?.org?.permissions || [];
  const hasMaster = orgPermissions.includes("master");

  const theme = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const timezone = useAppSelector((state) => state.ui.timezone);
  const mode = useAppSelector((state) => state.ui.mode);
  const chartType = useAppSelector((state) => state.ui.chartType);
  const [selectedTimezone, setSelectedTimezone] = useState<ITimeZone | null>(
    null
  );
  useEffect(() => {
    const tz = timezones.find((tz) => tz._id === timezone);
    setSelectedTimezone(tz || null);
  }, [timezone]);

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
