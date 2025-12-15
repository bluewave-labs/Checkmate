import React from "react";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Button } from "@/components/inputs";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type { ButtonGroupProps } from "@mui/material/ButtonGroup";
import { ChevronDown } from "lucide-react";

export const ButtonGroupInput = ({
  orientation,
  children,
  sx,
  ...props
}: ButtonGroupProps) => {
  const isVertical = orientation === "vertical";

  if (!isVertical) {
    return (
      <ButtonGroup
        orientation={orientation}
        {...props}
        sx={{
          height: 34,
          boxShadow: "none",
          ...sx,
        }}
      >
        {children}
      </ButtonGroup>
    );
  }

  const items = React.Children.toArray(children).filter(
    Boolean
  ) as React.ReactElement<any>[];
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const open = Boolean(anchorEl);

  const handleToggleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  const handleItemClick = (el: React.ReactElement, idx: number) => {
    setSelectedIndex(idx);
    const onClick = (el.props as any)?.onClick;
    if (typeof onClick === "function") onClick();
    handleClose();
  };

  const selected = items[selectedIndex];
  const selectedLabel = (selected?.props as any)?.children ?? "Actions";
  const selectedOnClick = (selected?.props as any)?.onClick as
    | (() => void)
    | undefined;
  const selectedLoading = Boolean((selected?.props as any)?.loading);

  return (
    <>
      <ButtonGroup
        orientation="horizontal"
        {...props}
        sx={{
          boxShadow: "none",
          width: "100%",
          ...sx,
        }}
      >
        <Button
          onClick={() => {
            if (typeof selectedOnClick === "function") selectedOnClick();
          }}
          loading={selectedLoading}
          size="small"
          variant="contained"
          color="secondary"
        >
          {selectedLabel}
        </Button>
        <Button
          onClick={handleToggleClick}
          size="small"
          variant="contained"
          color="secondary"
          sx={{
            minWidth: 44,
            width: 44,
          }}
        >
          <ChevronDown
            size={14}
            style={{
              transition: "transform 150ms ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </Button>
      </ButtonGroup>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted
        slotProps={{ list: { dense: true } }}
      >
        {items.length === 0 ? (
          <MenuItem disabled>No actions</MenuItem>
        ) : (
          items.map((el, idx) => (
            <MenuItem
              key={idx}
              selected={idx === selectedIndex}
              disabled={(el.props as any)?.disabled}
              onClick={() => handleItemClick(el, idx)}
            >
              {(el.props as any)?.children}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};
