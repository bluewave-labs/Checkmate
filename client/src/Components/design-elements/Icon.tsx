import type { LucideIcon } from "lucide-react";

interface IconProps {
	icon: LucideIcon;
	size?: number;
	strokeWidth?: number;
	stroke?: string;
	color?: string;
}

const Icon = ({ icon: Icon, size = 16, strokeWidth = 1.5, color }: IconProps) => {
	return (
		<Icon
			size={size}
			strokeWidth={strokeWidth}
			color={color}
		/>
	);
};

export default Icon;
