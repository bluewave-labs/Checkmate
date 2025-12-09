import CircularProgress, { type CircularProgressProps } from "@mui/material/CircularProgress";

type LoadingSpinnerProps = { show?: boolean } & CircularProgressProps;

export const LoadingSpinner = ({
  show = true,
  size = 18,
  thickness = 5,
  ...props
}: LoadingSpinnerProps) => (show ? (
  <CircularProgress size={size} thickness={thickness} {...props} />
) : null);
