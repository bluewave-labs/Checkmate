import type { LucideIcon, LucideProps } from "lucide-react";

interface IconProps extends LucideProps {
	icon: LucideIcon;
}

const Icon = ({
	icon: IconComponent,
	size = 16,
	strokeWidth = 1.5,
	...props
}: IconProps) => {
	return (
		<IconComponent
			size={size}
			strokeWidth={strokeWidth}
			{...props}
		/>
	);
};

export default Icon;
