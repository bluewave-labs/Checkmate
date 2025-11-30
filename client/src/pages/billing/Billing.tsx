import { BasePage, InfoBox } from "@/components/design-elements";

import { useAppSelector } from "@/hooks/AppHooks";

const BillingPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  console.log(user);
  return (
    <BasePage>
      <InfoBox
        title="Choose a plan!"
        description="Choose a plan that fits your needs and start enjoying our services."
      />
    </BasePage>
  );
};

export default BillingPage;
