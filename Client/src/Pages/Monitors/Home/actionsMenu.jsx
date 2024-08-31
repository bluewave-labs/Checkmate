import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { createToast } from "../../../Utils/toastUtils";
import {
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import {
  deleteUptimeMonitor,
  getUptimeMonitorsByTeamId,
} from "../../../Features/UptimeMonitors/uptimeMonitorsSlice";
import Settings from "../../../assets/icons/settings-bold.svg?react";
import Button from "../../../Components/Button";
import PropTypes from "prop-types";

const ActionsMenu = ({ monitor, isAdmin }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [actions, setActions] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const theme = useTheme();
  const authState = useSelector((state) => state.auth);

  const handleRemove = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    let monitor = { _id: actions.id };
    const action = await dispatch(
      deleteUptimeMonitor({ authToken: authState.authToken, monitor })
    );
    if (action.meta.requestStatus === "fulfilled") {
      setIsOpen(false); // close modal
      dispatch(getUptimeMonitorsByTeamId(authState.authToken));
      createToast({ body: "Monitor deleted successfully." });
    } else {
      createToast({ body: "Failed to delete monitor." });
    }
  };

  const openMenu = (event, id, url) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActions({ id: id, url: url });
  };

  const openRemove = (e) => {
    closeMenu(e);
    setIsOpen(true);
  };

  const closeMenu = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  const navigate = useNavigate();
  return (
    <>
      <IconButton
        aria-label="monitor actions"
        onClick={(event) => {
          event.stopPropagation();
          openMenu(
            event,
            monitor._id,
            monitor.type === "ping" ? null : monitor.url
          );
        }}
        sx={{
          "&:focus": {
            outline: "none",
          },
          "& svg path": {
            stroke: theme.palette.other.icon,
          },
        }}
      >
        <Settings />
      </IconButton>

      <Menu
        className="actions-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={(e) => closeMenu(e)}
        slotProps={{
          paper: {
            sx: {
              "& ul": { p: theme.spacing(2.5) },
              "& li": { m: 0 },
              "& li:last-of-type": {
                color: theme.palette.error.text,
              },
            },
          },
        }}
      >
        {actions.url !== null ? (
          <MenuItem
            onClick={(e) => {
              closeMenu(e);
              e.stopPropagation();
              window.open(actions.url, "_blank", "noreferrer");
            }}
          >
            Open site
          </MenuItem>
        ) : (
          ""
        )}
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/monitors/${actions.id}`);
          }}
        >
          Details
        </MenuItem>
        {/* TODO - pass monitor id to Incidents page */}
        <MenuItem disabled>Incidents</MenuItem>
        {isAdmin && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();

              navigate(`/monitors/configure/${actions.id}`);
            }}
          >
            Configure
          </MenuItem>
        )}
        {isAdmin && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              openRemove(e);
            }}
          >
            Remove
          </MenuItem>
        )}
      </Menu>
      <Modal
        aria-labelledby="modal-delete-monitor"
        aria-describedby="delete-monitor-confirmation"
        open={isOpen}
        onClose={(e) => {
          e.stopPropagation();
          setIsOpen(false);
        }}
      >
        <Stack
          gap={theme.spacing(2)}
          color={theme.palette.text.secondary}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: theme.palette.background.main,
            border: 1,
            borderColor: theme.palette.border.light,
            borderRadius: theme.shape.borderRadius,
            boxShadow: 24,
            p: theme.spacing(15),
            "&:focus": {
              outline: "none",
            },
          }}
        >
          <Typography id="modal-delete-monitor" component="h2" fontWeight={600}>
            Do you really want to delete this monitor?
          </Typography>
          <Typography id="delete-monitor-confirmation" fontSize={13}>
            Once deleted, this monitor cannot be retrieved.
          </Typography>
          <Stack
            direction="row"
            gap={theme.spacing(4)}
            mt={theme.spacing(12)}
            justifyContent="flex-end"
          >
            <Button
              level="tertiary"
              label="Cancel"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <Button
              level="error"
              label="Delete"
              onClick={(e) => {
                e.stopPropagation(e);
                handleRemove(e);
              }}
            />
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};

ActionsMenu.propTypes = {
  monitor: PropTypes.shape({
    _id: PropTypes.string,
    url: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  isAdmin: PropTypes.bool,
};

export default ActionsMenu;
