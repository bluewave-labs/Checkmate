import React, { useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import { Settings } from "lucide-react";

export type ActionMenuItem = {
  id: number | string;
  label: React.ReactNode;
  action: Function;
  closeMenu?: boolean;
};

export const ActionsMenu = ({ items }: { items: ActionMenuItem[] }) => {
  const [anchorEl, setAnchorEl] = useState<null | any>(null);
  const open = Boolean(anchorEl);

  const handleClick = (e: React.MouseEvent<any>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (e: React.MouseEvent<any>) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton onClick={handleClick}>
        <Settings size={20} strokeWidth={1.5} />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {items.map((item) => (
          <MenuItem
            key={item.id}
            onClick={(e: React.MouseEvent<HTMLLIElement>) => {
              e.stopPropagation();
              if (item.closeMenu) handleClose(e);
              item.action();
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};
