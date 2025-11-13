import { ChevronLeft, ChevronsLeft, MoveLeft } from "lucide-react";

export const ArrowLeft = ({
  type,
  color = "#667085",
  size = 24,
  ...props
}: {
  type?: string,
  color?: string | undefined,
  size?: number,
  [key: string]: any,
}) => {
  if (type === "double") {
    return <ChevronsLeft color={color} size={size} strokeWidth={1.5} {...props} />;
  } else if (type === "long") {
    return <MoveLeft color={color} size={size} strokeWidth={1.5} {...props} />;
  } else {
    return <ChevronLeft color={color} size={size} strokeWidth={1.5} {...props} />;
  }
};
