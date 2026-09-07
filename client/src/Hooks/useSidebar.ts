import type { RootState } from "@/Types/state";
import { useSelector } from "react-redux";

// CSS variable names for sidebar widths
const SIDEBAR_WIDTH_VAR = 250;
const SIDEBAR_COLLAPSED_WIDTH_VAR = 64;

// Transition timing for sidebar width changes
const SIDEBAR_TRANSITION_TIMING = "650ms cubic-bezier(0.36, -0.01, 0, 0.77)";
const SIDEBAR_TRANSITION = `width ${SIDEBAR_TRANSITION_TIMING}`;

export const useSidebar = () => {
	const collapsed = useSelector(
		(state: RootState) => state.ui.sidebar?.collapsed ?? false
	);

	return {
		collapsed,
		collapsedWidth: SIDEBAR_COLLAPSED_WIDTH_VAR,
		expandedWidth: SIDEBAR_WIDTH_VAR,
		width: collapsed ? SIDEBAR_COLLAPSED_WIDTH_VAR : SIDEBAR_WIDTH_VAR,
		transition: SIDEBAR_TRANSITION,
		transitionTiming: SIDEBAR_TRANSITION_TIMING,
	};
};

export default useSidebar;
