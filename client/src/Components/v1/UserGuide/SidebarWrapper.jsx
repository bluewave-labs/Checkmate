import { useState, useEffect, useCallback, useRef } from "react";
import { useUserGuideTheme } from "./styles/useUserGuideTheme";
import TabBar from "./TabBar";
import SidebarHeader from "./SidebarHeader";
import UserGuideLanding from "./UserGuideLanding";
import CollectionPage from "./CollectionPage";
import ArticlePage from "./ArticlePage";
import ContentRenderer from "./ContentRenderer";
import HelpSection from "./HelpSection";
import SearchResults from "./SearchResults";
import { getCollection, getArticle } from "./content/userGuideConfig";
import { getArticleContent } from "./content";
import { extractToc } from "./content/contentTypes";
import { useUserGuideSidebarContext, DEFAULT_CONTENT_WIDTH } from "./UserGuideSidebarContext";
import "./SidebarWrapper.css";

const STORAGE_KEY = "checkmate-sidebar-state";
const MIN_CONTENT_WIDTH = DEFAULT_CONTENT_WIDTH;
const MAX_CONTENT_WIDTH = DEFAULT_CONTENT_WIDTH * 2; // 100% wider

const SidebarWrapper = ({ isOpen, onClose, onOpen, initialPath, onOpenInNewTab }) => {
	const { setContentWidth: setContextContentWidth } = useUserGuideSidebarContext();
	const { colors, border } = useUserGuideTheme();
	const [activeTab, setActiveTab] = useState("user-guide");
	const [collectionId, setCollectionId] = useState(undefined);
	const [articleId, setArticleId] = useState(undefined);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [contentWidth, setContentWidthLocal] = useState(DEFAULT_CONTENT_WIDTH);
	const [isResizing, setIsResizing] = useState(false);
	const [isHoveringHandle, setIsHoveringHandle] = useState(false);
	const [mouseY, setMouseY] = useState(0);
	const resizeRef = useRef(null);
	const handleRef = useRef(null);

	// Sync content width with context whenever it changes
	const setContentWidth = useCallback(
		(width) => {
			setContentWidthLocal(width);
			setContextContentWidth(width);
		},
		[setContextContentWidth]
	);

	// Initialize context with current width on mount
	useEffect(() => {
		setContextContentWidth(DEFAULT_CONTENT_WIDTH);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	// Navigation history
	const [history, setHistory] = useState([
		{ collectionId: undefined, articleId: undefined },
	]);
	const [historyIndex, setHistoryIndex] = useState(0);
	const isNavigatingRef = useRef(false);

	// Parse initial path on mount
	useEffect(() => {
		if (initialPath) {
			const parts = initialPath.split("/");
			if (parts.length >= 1 && parts[0]) {
				setCollectionId(parts[0]);
				if (parts.length >= 2 && parts[1]) {
					setArticleId(parts[1]);
				}
			}
		}
	}, [initialPath]);

	// Persist sidebar state to localStorage
	useEffect(() => {
		if (isOpen) {
			const state = { activeTab, collectionId, articleId };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		}
	}, [isOpen, activeTab, collectionId, articleId]);

	// Restore state from localStorage on mount
	useEffect(() => {
		const savedState = localStorage.getItem(STORAGE_KEY);
		if (savedState && !initialPath) {
			try {
				const {
					activeTab: savedTab,
					collectionId: savedCollection,
					articleId: savedArticle,
				} = JSON.parse(savedState);
				if (savedTab) setActiveTab(savedTab);
				if (savedCollection) setCollectionId(savedCollection);
				if (savedArticle) setArticleId(savedArticle);
			} catch (e) {
				// Ignore parse errors
			}
		}
	}, [initialPath]);

	// Track navigation changes in history
	useEffect(() => {
		if (isNavigatingRef.current) {
			isNavigatingRef.current = false;
			return;
		}
		// Only track if this is a new navigation (not from back/forward)
		const currentEntry = history[historyIndex];
		if (
			currentEntry?.collectionId !== collectionId ||
			currentEntry?.articleId !== articleId
		) {
			// Truncate forward history and add new entry
			const newHistory = [
				...history.slice(0, historyIndex + 1),
				{ collectionId, articleId },
			];
			setHistory(newHistory);
			setHistoryIndex(newHistory.length - 1);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [collectionId, articleId]);

	// Navigation handlers
	const handleNavigate = useCallback((newCollectionId, newArticleId) => {
		setCollectionId(newCollectionId);
		setArticleId(newArticleId);
	}, []);

	const handleBackToHome = useCallback(() => {
		setCollectionId(undefined);
		setArticleId(undefined);
	}, []);

	// Back/Forward navigation
	const canGoBack = historyIndex > 0;
	const canGoForward = historyIndex < history.length - 1;

	const handleBack = useCallback(() => {
		if (historyIndex > 0) {
			isNavigatingRef.current = true;
			const prevIndex = historyIndex - 1;
			const prevEntry = history[prevIndex];
			setHistoryIndex(prevIndex);
			setCollectionId(prevEntry.collectionId);
			setArticleId(prevEntry.articleId);
		}
	}, [historyIndex, history]);

	const handleForward = useCallback(() => {
		if (historyIndex < history.length - 1) {
			isNavigatingRef.current = true;
			const nextIndex = historyIndex + 1;
			const nextEntry = history[nextIndex];
			setHistoryIndex(nextIndex);
			setCollectionId(nextEntry.collectionId);
			setArticleId(nextEntry.articleId);
		}
	}, [historyIndex, history]);

	const handleBackToCollection = useCallback(() => {
		setArticleId(undefined);
	}, []);

	const handleHomeClick = useCallback(() => {
		setCollectionId(undefined);
		setArticleId(undefined);
	}, []);

	// Get current collection and article
	const collection = collectionId ? getCollection(collectionId) : undefined;
	const article = collectionId && articleId ? getArticle(collectionId, articleId) : undefined;

	// Get prev/next articles for navigation
	const getAdjacentArticles = () => {
		if (!collection || !articleId) return { prev: undefined, next: undefined };
		const currentIndex = collection.articles.findIndex((a) => a.id === articleId);
		return {
			prev: currentIndex > 0 ? collection.articles[currentIndex - 1] : undefined,
			next:
				currentIndex < collection.articles.length - 1
					? collection.articles[currentIndex + 1]
					: undefined,
		};
	};

	const { prev: prevArticle, next: nextArticle } = getAdjacentArticles();

	// Get article content
	const articleContent =
		collectionId && articleId ? getArticleContent(collectionId, articleId) : undefined;

	// Auto-generate TOC from content headings
	const tocItems = articleContent ? extractToc(articleContent.blocks) : undefined;

	// Build breadcrumb items for dropdown
	const buildBreadcrumbs = () => {
		let items = [];
		switch (activeTab) {
			case "user-guide":
				items = [{ label: "User guide", onClick: handleHomeClick }];
				if (collection) {
					items.push({ label: collection.title, onClick: () => setArticleId(undefined) });
				}
				if (article) {
					items.push({ label: article.title, onClick: () => {} });
				}
				return items;
			default:
				return [{ label: "Help", onClick: () => {} }];
		}
	};

	// Handle "Open in new tab"
	const handleOpenInNewTab = () => {
		let path = "https://bluewavelabs.gitbook.io/checkmate";
		if (onOpenInNewTab) {
			onOpenInNewTab();
		} else {
			window.open(path, "_blank", "noopener,noreferrer");
		}
	};

	// Clear search and close search bar
	const handleClearSearch = useCallback(() => {
		setSearchQuery("");
		setIsSearchOpen(false);
	}, []);

	// Render User Guide content
	const renderUserGuideContent = () => {
		// Show search results when search is active
		if (isSearchOpen && searchQuery.trim().length > 0) {
			return (
				<SearchResults
					query={searchQuery}
					onNavigate={(colId, artId) => {
						handleNavigate(colId, artId);
						handleClearSearch();
					}}
					onClearSearch={handleClearSearch}
				/>
			);
		}

		if (collection && article) {
			return (
				<ArticlePage
					collection={collection}
					article={article}
					onBack={handleBackToCollection}
					onBackToHome={handleBackToHome}
					prevArticle={prevArticle}
					nextArticle={nextArticle}
					onPrevArticle={
						prevArticle ? () => handleNavigate(collectionId, prevArticle.id) : undefined
					}
					onNextArticle={
						nextArticle ? () => handleNavigate(collectionId, nextArticle.id) : undefined
					}
					tocItems={tocItems}
					mode="in-app"
				>
					{articleContent && (
						<ContentRenderer content={articleContent} onNavigate={handleNavigate} />
					)}
				</ArticlePage>
			);
		}

		if (collection) {
			return (
				<CollectionPage
					collection={collection}
					onArticleClick={(id) => handleNavigate(collectionId, id)}
				/>
			);
		}

		return (
			<UserGuideLanding
				onNavigate={handleNavigate}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				mode="in-app"
			/>
		);
	};

	const contentArea = (tabValue) => {
		switch (tabValue) {
			case "user-guide":
				return renderUserGuideContent();
			default:
				return <HelpSection />;
		}
	};

	// Handle tab click - open sidebar if closed, close if clicking active tab, or switch tab
	const handleTabClick = (tab) => {
		if (!isOpen) {
			onOpen();
			setActiveTab(tab);
		} else if (activeTab === tab) {
			// Clicking the already-active tab closes the sidebar
			onClose();
		} else {
			// Clicking a different tab switches to it
			setActiveTab(tab);
		}
	};

	// Resize handlers
	const handleResizeStart = useCallback(
		(e) => {
			e.preventDefault();
			setIsResizing(true);
			resizeRef.current = { startX: e.clientX, startWidth: contentWidth };
		},
		[contentWidth]
	);

	const handleResizeMove = useCallback(
		(e) => {
			if (!isResizing || !resizeRef.current) return;

			const deltaX = resizeRef.current.startX - e.clientX;
			const newWidth = Math.min(
				MAX_CONTENT_WIDTH,
				Math.max(MIN_CONTENT_WIDTH, resizeRef.current.startWidth + deltaX)
			);
			setContentWidth(newWidth);
		},
		[isResizing, setContentWidth]
	);

	const handleResizeEnd = useCallback(() => {
		setIsResizing(false);
		setIsHoveringHandle(false);
		resizeRef.current = null;
	}, []);

	// Add/remove resize event listeners
	useEffect(() => {
		if (isResizing) {
			document.addEventListener("mousemove", handleResizeMove);
			document.addEventListener("mouseup", handleResizeEnd);
			document.body.style.cursor = "ew-resize";
			document.body.style.userSelect = "none";
		}
		return () => {
			document.removeEventListener("mousemove", handleResizeMove);
			document.removeEventListener("mouseup", handleResizeEnd);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};
	}, [isResizing, handleResizeMove, handleResizeEnd]);

	return (
		<div
			className="user-guide-sidebar-container"
			style={{
				position: "fixed",
				top: 0,
				right: 0,
				height: "100vh",
				display: "flex",
				zIndex: 1100,
			}}
		>
			{/* Resize Handle - positioned absolutely on the left edge */}
			<div
				ref={handleRef}
				onMouseDown={handleResizeStart}
				onMouseEnter={() => setIsHoveringHandle(true)}
				onMouseLeave={() => !isResizing && setIsHoveringHandle(false)}
				onMouseMove={(e) => {
					if (handleRef.current) {
						const rect = handleRef.current.getBoundingClientRect();
						setMouseY(e.clientY - rect.top);
					}
				}}
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					width: 8,
					height: "100%",
					cursor: "ew-resize",
					zIndex: 20,
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-start",
				}}
			>
				{/* Visual indicator line */}
				<div
					style={{
						width: isResizing ? 2 : 1,
						height: "100%",
						backgroundColor:
							isResizing || isHoveringHandle ? "#4CAF93" : colors.border.default,
						transition: isResizing ? "none" : "all 150ms ease",
						position: "relative",
					}}
				>
					{/* Grab indicator follows mouse */}
					{(isHoveringHandle || isResizing) && (
						<div
							style={{
								position: "absolute",
								left: -1,
								top: mouseY - 10,
								width: 3,
								height: 20,
								backgroundColor: "#555",
								borderRadius: 1,
							}}
						/>
					)}
				</div>
			</div>

			{/* Tab Bar - Always visible */}
			<TabBar activeTab={isOpen ? activeTab : undefined} onTabChange={handleTabClick} />

			{/* Main Sidebar Content - Slides in/out */}
			<div
				style={{
					width: isOpen ? contentWidth : 0,
					height: "100%",
					backgroundColor: colors.background.white,
					borderLeft: isOpen ? border.default : "none",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					transition: isResizing ? "none" : "width 300ms ease-in-out",
					position: "relative",
				}}
			>
				{isOpen && (
					<>
						{/* Header */}
						<SidebarHeader
							showOpenInNewTab={activeTab === "user-guide"}
							showNavigation={activeTab === "user-guide"}
							breadcrumbs={buildBreadcrumbs()}
							onHomeClick={handleHomeClick}
							onBack={handleBack}
							onForward={handleForward}
							canGoBack={canGoBack}
							canGoForward={canGoForward}
							onClose={onClose}
							onOpenInNewTab={handleOpenInNewTab}
							isSearchOpen={isSearchOpen}
							onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
						/>

						{/* Content Area */}
						<div
							style={{
								flex: 1,
								overflowY: "auto",
								backgroundColor: colors.background.alt,
							}}
						>
							{contentArea(activeTab)}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default SidebarWrapper;
