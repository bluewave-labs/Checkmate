import { ChevronRight, ChevronsRight } from "lucide-react";

export const ArrowRight = ({
  type,
  color = "#667085",
  size = 24,
  ...props
}: {
  type?: string;
  color?: string | undefined;
  size?: number;
  [key: string]: any;
}) => {
  if (type === "double") {
    return <ChevronsRight color={color} size={size} strokeWidth={1.5} {...props} />;
  } else {
    return <ChevronRight color={color} size={size} strokeWidth={1.5} {...props} />;
  }
};
