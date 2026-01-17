import SidebarWrapper from "./SidebarWrapper";
import {
	UserGuideSidebarProvider,
	useUserGuideSidebarContext,
	TAB_BAR_WIDTH,
	DEFAULT_CONTENT_WIDTH,
} from "./UserGuideSidebarContext";

// Main component that wraps SidebarWrapper with context consumer
const UserGuideSidebar = () => {
	const { isOpen, open, close } = useUserGuideSidebarContext();

	return (
		<SidebarWrapper
			isOpen={isOpen}
			onOpen={open}
			onClose={close}
		/>
	);
};

export {
	UserGuideSidebar,
	UserGuideSidebarProvider,
	useUserGuideSidebarContext,
	TAB_BAR_WIDTH,
	DEFAULT_CONTENT_WIDTH,
};

export default UserGuideSidebar;
