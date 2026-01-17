import { createContext, useContext, useState, useCallback, useEffect } from "react";

const SIDEBAR_STATE_KEY = "checkmate-sidebar-open";

// Constants for sidebar dimensions
export const TAB_BAR_WIDTH = 41; // 40px width + 1px border
export const DEFAULT_CONTENT_WIDTH = 400;
// Gap when sidebar is closed (need more space since tab bar is narrow)
export const CLOSED_GAP = 24;
// Gap when sidebar is open (less needed since content edge is clear)
export const OPEN_GAP = 8;

const UserGuideSidebarContext = createContext(null);

export const UserGuideSidebarProvider = ({ children }) => {
	const [isOpen, setIsOpen] = useState(() => {
		if (typeof window === "undefined") return false;
		const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
		return saved === "true";
	});

	const [currentPath, setCurrentPath] = useState(undefined);
	const [contentWidth, setContentWidth] = useState(DEFAULT_CONTENT_WIDTH);

	// Calculate total sidebar width and required padding
	const totalSidebarWidth = isOpen ? TAB_BAR_WIDTH + contentWidth : TAB_BAR_WIDTH;
	const gap = isOpen ? OPEN_GAP : CLOSED_GAP;
	const requiredPaddingRight = totalSidebarWidth + gap;

	// Set CSS custom properties on document root for global access
	useEffect(() => {
		if (typeof document === "undefined") return;

		const root = document.documentElement;
		root.style.setProperty("--help-sidebar-width", `${totalSidebarWidth}px`);
		root.style.setProperty("--help-sidebar-padding", `${requiredPaddingRight}px`);
	}, [totalSidebarWidth, requiredPaddingRight]);

	// Update body class for content push effect
	useEffect(() => {
		if (typeof document === "undefined") return;

		if (isOpen) {
			document.body.classList.add("user-guide-sidebar-open");
		} else {
			document.body.classList.remove("user-guide-sidebar-open");
		}

		return () => {
			document.body.classList.remove("user-guide-sidebar-open");
		};
	}, [isOpen]);

	// Persist state to localStorage
	useEffect(() => {
		if (typeof window === "undefined") return;
		localStorage.setItem(SIDEBAR_STATE_KEY, String(isOpen));
	}, [isOpen]);

	const open = useCallback((path) => {
		setCurrentPath(path);
		setIsOpen(true);
	}, []);

	const close = useCallback(() => {
		setIsOpen(false);
	}, []);

	const toggle = useCallback(() => {
		setIsOpen((prev) => !prev);
	}, []);

	return (
		<UserGuideSidebarContext.Provider
			value={{
				isOpen,
				open,
				close,
				toggle,
				currentPath,
				contentWidth,
				setContentWidth,
				totalSidebarWidth,
				requiredPaddingRight,
			}}
		>
			{children}
		</UserGuideSidebarContext.Provider>
	);
};

export const useUserGuideSidebarContext = () => {
	const context = useContext(UserGuideSidebarContext);
	if (!context) {
		throw new Error(
			"useUserGuideSidebarContext must be used within a UserGuideSidebarProvider"
		);
	}
	return context;
};

export default UserGuideSidebarContext;
