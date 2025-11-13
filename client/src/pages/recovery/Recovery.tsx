import { AuthBasePage } from "@/components/auth";

import { RecoveryForm } from "./RecoveryForm";
import { recoverySchema } from "@/validation/zod";
import { z } from "zod";
import { usePost } from "@/hooks/UseApi";
import { useToast } from "@/hooks/UseToast";

type FormData = z.infer<typeof recoverySchema>;

const Recovery = () => {
  const { post, loading } = usePost<FormData>();
  const { showToast } = useToast();

  const onSubmit = async (data: FormData) => {
    await post("/recovery", data);
    showToast("If the email exists, a recovery link has been sent");
  };

  return (
    <AuthBasePage title="Enter your email to recover your account">
      <RecoveryForm onSubmit={onSubmit} loading={loading} />
    </AuthBasePage>
  );
};

export default Recovery;
