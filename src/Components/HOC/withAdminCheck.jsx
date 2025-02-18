import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { logger } from "../../Utils/Logger";
import { networkService } from "../../main";

const withAdminCheck = (WrappedComponent) => {
	const WithAdminCheck = (props) => {
		const navigate = useNavigate();

		useEffect(() => {
			networkService
				.doesSuperAdminExist()
				.then((response) => {
					if (response.data.data === true) {
						navigate("/login");
					}
				})
				.catch((error) => {
					logger.error(error);
				});
		}, [navigate]);
		return (
			<WrappedComponent
				{...props}
				isSuperAdmin={true}
			/>
		);
	};
	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || "Component";
	WithAdminCheck.displayName = `WithAdminCheck(${wrappedComponentName})`;

	return WithAdminCheck;
};

export default withAdminCheck;
