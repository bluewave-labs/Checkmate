import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { logger } from "../../Utils/Logger";
import { networkService } from "../../main";

const withAdminCheck = (WrappedComponent) => {
	const WithAdminCheck = (props) => {
		const navigate = useNavigate();
		const [isChecking, setIsChecking] = useState(true);
		const [superAdminExists, setSuperAdminExists] = useState(false);

		useEffect(() => {
			networkService
				.doesSuperAdminExist()
				.then((response) => {
					if (response?.data?.data === true) {
						navigate("/login");
					} else {
						setSuperAdminExists(true);
					}
				})
				.catch((error) => {
					logger.error(error);
				})
				.finally(() => {
					setIsChecking(false);
				});
		}, [navigate]);

		if (isChecking) {
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
