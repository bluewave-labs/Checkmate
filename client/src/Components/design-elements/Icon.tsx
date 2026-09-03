import type { LucideIcon } from "lucide-react";

interface IconProps {
	icon: LucideIcon;
	size?: number;
	strokeWidth?: number;
	stroke?: string;
	color?: string;
}

// 16 is the house size: 17 call sites ask for it explicitly against 2 for 20,
// and the sidebar clamps to 16 in CSS. A 20px default put icons above the cap
// height of the 13px text they sit beside.
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
