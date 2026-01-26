import type { LucideIcon } from "lucide-react";

interface IconProps {
	icon: LucideIcon;
	size?: number;
	strokeWidth?: number;
}

const Icon = ({ icon: Icon, size = 20, strokeWidth = 1.5 }: IconProps) => {
	return (
		<Icon
			size={size}
			strokeWidth={strokeWidth}
		/>
	);
};

export default Icon;
