import { AuthBasePage } from "@/components/auth";

import { useTranslation } from "react-i18next";
import { RecoveryForm } from "./RecoveryForm";
import { recoverySchema } from "@/validation/zod";
import { z } from "zod";
import { usePost } from "@/hooks/UseApi";
import { useToast } from "@/hooks/UseToast";

type FormData = z.infer<typeof recoverySchema>;

const Recovery = () => {
  const { t } = useTranslation();
  const { post, loading } = usePost<FormData>();
  const { showToast } = useToast();

  const onSubmit = async (data: FormData) => {
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
