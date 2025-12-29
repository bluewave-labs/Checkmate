import { AuthBasePage } from "@/components/auth";

import { useTranslation } from "react-i18next";
import { RecoveryForm } from "./RecoveryForm";
import { usePost } from "@/hooks/UseApi";
import { useToast } from "@/hooks/UseToast";
import type { FormValues } from "@/pages/recovery/RecoveryForm";

const Recovery = () => {
  const { t } = useTranslation();
  const { post, loading } = usePost<FormValues>();
  const { showToast } = useToast();

  const onSubmit = async (data: FormValues) => {
    await post("/recovery", data);
    showToast(t("common.toasts.recoveryEmailSent"));
  };

  return (
    <AuthBasePage title={t("auth.recovery.header.title")}>
      <RecoveryForm onSubmit={onSubmit} loading={loading} />
    </AuthBasePage>
  );
};

export default Recovery;
