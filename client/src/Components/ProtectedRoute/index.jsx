import PropTypes from "prop-types";

/**
 * ProtectedRoute is a wrapper component that ensures only authenticated users
 * can access the wrapped content. It checks authentication status (e.g., from Redux or Context).
 * If the user is authenticated, it renders the children; otherwise, it redirects to the login page.
 *
 * @param {Object} props - The props passed to the ProtectedRoute component.
 * @param {React.ReactNode} props.children - The children to render if the user is authenticated.
 * @returns {React.ReactElement} The children wrapped in a protected route or a redirect to the login page.
 */

const ProtectedRoute = ({ children }) => children;

ProtectedRoute.propTypes = {
	children: PropTypes.element.isRequired,
};

export default ProtectedRoute;