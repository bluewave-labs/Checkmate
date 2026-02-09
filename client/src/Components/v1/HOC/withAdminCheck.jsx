import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { logger } from "../../../Utils/Logger.js";
import { useLazyGet } from "@/Hooks/UseApi";

const withAdminCheck = (WrappedComponent) => {
	const WithAdminCheck = (props) => {
		const navigate = useNavigate();
		const [superAdminExists, setSuperAdminExists] = useState(false);
		const [hasChecked, setHasChecked] = useState(false);
		const { get: checkSuperAdmin, loading: isChecking } = useLazyGet();

		useEffect(() => {
			checkSuperAdmin("/auth/users/superadmin")
				.then((response) => {
					if (response?.data === true) {
						navigate("/login");
					} else {
						setSuperAdminExists(false);
					}
				})
				.catch((error) => {
					logger.error(error);
				})
				.finally(() => {
					setHasChecked(true);
				});
		}, [navigate, checkSuperAdmin]);

		if (!hasChecked || isChecking) {
			return null;
		}

		return (
			<WrappedComponent
				{...props}
				superAdminExists={superAdminExists}
			/>
		);
	};
	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || "Component";
	WithAdminCheck.displayName = `WithAdminCheck(${wrappedComponentName})`;

	return WithAdminCheck;
};

export default withAdminCheck;
