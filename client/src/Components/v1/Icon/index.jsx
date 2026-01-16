import { useTheme } from "@mui/material";
import PropTypes from "prop-types";
import {
	Activity,
	AlertCircle,
	AlertTriangle,
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ArrowUpRight,
	Bell,
	Calendar,
	Check,
	CheckCircle,
	CheckSquare,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUpDown,
	Circle,
	CircleDot,
	Clock,
	Code,
	Cpu,
	Database,
	ExternalLink,
	Eye,
	EyeOff,
	FileText,
	Gauge,
	Globe,
	GripVertical,
	HelpCircle,
	History,
	Image as ImageIcon,
	Info,
	Key,
	Layers,
	Link,
	Lock,
	LogOut,
	Mail,
	Menu,
	MessageCircle,
	MoreVertical,
	Pause,
	PauseCircle,
	Play,
	PlayCircle,
	PlusCircle,
	RefreshCw,
	Ruler,
	Search,
	Settings,
	Square,
	Trash2,
	TrendingUp,
	Upload,
	User,
	Users,
	Wifi,
	Wrench,
	X,
} from "lucide-react";

/**
 * Map of icon names to Lucide icon components.
 * Only icons explicitly imported here will be included in the bundle (tree-shaking).
 * To add a new icon: import it above and add it to this object.
 */
const iconComponents = {
	Activity,
	AlertCircle,
	AlertTriangle,
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ArrowUpRight,
	Bell,
	Calendar,
	Check,
	CheckCircle,
	CheckSquare,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUpDown,
	Circle,
	CircleDot,
	Clock,
	Code,
	Cpu,
	Database,
	ExternalLink,
	Eye,
	EyeOff,
	FileText,
	Gauge,
	Globe,
	GripVertical,
	HelpCircle,
	History,
	Image: ImageIcon,
	Info,
	Key,
	Layers,
	Link,
	Lock,
	LogOut,
	Mail,
	Menu,
	MessageCircle,
	MoreVertical,
	Pause,
	PauseCircle,
	Play,
	PlayCircle,
	PlusCircle,
	RefreshCw,
	Ruler,
	Search,
	Settings,
	Square,
	Trash2,
	TrendingUp,
	Upload,
	User,
	Users,
	Wifi,
	Wrench,
	X,
};

/**
 * Theme-aware icon component wrapping Lucide icons
 *
 * @param {string} name - Lucide icon name (e.g., "Bell", "Check", "ArrowLeft")
 * @param {number} size - Icon size in pixels (default: 20)
 * @param {string} color - Direct color value OR theme path like "primary.contrastText"
 * @param {number} strokeWidth - Stroke width (default: 1.5)
 * @param {string} fill - Fill color (default: "none")
 */
const Icon = ({ name, size = 20, color, strokeWidth = 1.5, fill = "none", ...props }) => {
	const theme = useTheme();

	// Resolve color from theme path or use direct value
	const resolveColor = (colorValue) => {
		if (!colorValue) {
			return theme.palette.primary.contrastTextTertiary; // Default icon color
		}

		// If it's a theme path like "primary.contrastText"
		if (typeof colorValue === "string" && colorValue.includes(".")) {
			const parts = colorValue.split(".");
			let resolved = theme.palette;
			for (const part of parts) {
				resolved = resolved?.[part];
			}
			return resolved || colorValue;
		}

		// Direct color value
		return colorValue;
	};

	const LucideIcon = iconComponents[name];

	if (!LucideIcon) {
		console.warn(`Icon "${name}" not found in Icon component`);
		return null;
	}

	return (
		<LucideIcon
			size={size}
			color={resolveColor(color)}
			strokeWidth={strokeWidth}
			fill={fill}
			{...props}
		/>
	);
};

Icon.propTypes = {
	name: PropTypes.string.isRequired,
	size: PropTypes.number,
	color: PropTypes.string,
	strokeWidth: PropTypes.number,
	fill: PropTypes.string,
};

export default Icon;
