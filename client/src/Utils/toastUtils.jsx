import PropTypes from "prop-types";
import { toast, Slide } from "react-toastify";
import Alert from "../Components/Alert";

/**
 * @param {object} props
 * @param {'info' | 'error' | 'warning'} - The variant of the alert (e.g., "info", "error").
 * @param {string} props.title - The title of the alert.
 * @param {string} props.body - The body/content of the alert.
 * @param {boolean} props.hasIcon - Whether the alert should include an icon.
 * @param {object} [props.config] - Additional configuration props for the toast.
 */

export const createToast = ({
	variant = "info",
	title,
	body,
	hasIcon = false,
	config = {},
}) => {
	const toastConfig = {
		position: "top-right",
		autoClose: 3000,
		hideProgressBar: true,
		closeButton: false,
		transition: Slide,
		...config,
	};

	toast(
		({ closeToast }) => (
			<Alert
				variant={variant}
				title={title}
				body={body}
				isToast={true}
				hasIcon={hasIcon}
				onClick={closeToast}
			/>
		),
		toastConfig
	);
};

createToast.propTypes = {
	variant: PropTypes.oneOf(["info", "error", "warning"]),
	title: PropTypes.string,
	body: PropTypes.string.isRequired,
	hasIcon: PropTypes.bool,
	config: PropTypes.object,
};
