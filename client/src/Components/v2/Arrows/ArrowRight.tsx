import RightArrow from "@/assets/icons/right-arrow.svg?react";
import RightArrowDouble from "@/assets/icons/right-arrow-double.svg?react";

export const ArrowRight = ({
	type,
	color = "#667085",
	...props
}: {
	type?: string;
	color?: string | undefined;
	[key: string]: any;
}) => {
	if (type === "double") {
		return (
			<RightArrowDouble
				style={{ color }}
				{...props}
			/>
		);
	} else {
		return (
			<RightArrow
				style={{ color }}
				{...props}
			/>
		);
	}
};
