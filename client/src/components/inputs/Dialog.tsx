import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Button } from "@/components/inputs";
import { typographyLevels } from "@/theme/palette";

export const DialogInput = ({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmColor = "accent",
  cancelColor = "error",
}: {
  open: boolean;
  title?: string;
  content?: string;
  onConfirm?(item: any): any;
  onCancel?(item: any): any;
  confirmColor?: "error" | "accent";
  cancelColor?: "error" | "accent";
}) => {
  return (
    <Dialog open={open}>
      <DialogTitle sx={{ fontSize: typographyLevels.l }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color={cancelColor} onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
