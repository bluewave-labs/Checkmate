import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

/**
 * @param {Object} props - The props passed to the ProtectedDistributedUptimeRoute component.
 * @param {React.ReactNode} props.children - The children to render if the user is authenticated.
 * @returns {React.ReactElement} The children wrapped in a protected route or a redirect to the login page.
 */

const ProtectedDistributedUptimeRoute = ({ children }) => {
	const distributedUptimeEnabled = useSelector(
		(state) => state.ui.distributedUptimeEnabled
	);

	return distributedUptimeEnabled === true ? (
		children
	) : (
		<Navigate
			to="/uptime"
			replace
		/>
	);
};

ProtectedDistributedUptimeRoute.propTypes = {
	children: PropTypes.node.isRequired,
};

export default ProtectedDistributedUptimeRoute;
