import { useState } from "react";
import { styled, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ThemeSwitch from "../ThemeSwitch";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

const StyledToolbar = styled(Toolbar)(({ theme, mode }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	flexShrink: 0,
	borderRadius: `calc(${theme.shape.borderRadius}px + 4px)`,
	backdropFilter: "blur(24px)",
	border: "1px solid",
	borderColor:
		mode === "light"
			? alpha(theme.palette.common.black, 0.1)
			: alpha(theme.palette.common.white, 0.1),
	backgroundColor:
		mode === "light"
			? alpha(theme.palette.common.white, 0.4)
			: alpha(theme.palette.common.black, 0.4),
	boxShadow: theme.shadows[3],
	padding: "8px 12px",
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
	fontSize: "1.1rem",
	margin: theme.spacing(4, 2),
}));

const AppAppBar = () => {
	const [open, setOpen] = useState(false);
	const theme = useTheme();
	const mode = useSelector((state) => state.ui.mode);
	const location = useLocation();
	const navigate = useNavigate();

	// Debugging: Log the current theme mode
	console.log("Current theme mode:", mode);

	const logoSrc =
		mode === "light" ? "/images/prism-black.png" : "/images/prism-white.png";

	const toggleDrawer = (newOpen) => () => {
		setOpen(newOpen);
	};

	const handleScroll = (id) => {
		if (location.pathname === "/") {
			const element = document.getElementById(id);
			if (element) {
				element.scrollIntoView({ behavior: "smooth" });
			}
		} else {
			navigate(`/#${id}`);
		}
	};

	return (
		<AppBar
			position="fixed"
			sx={{
				boxShadow: 0,
				bgcolor: "transparent",
				backgroundImage: "none",
				border: "none",
				mt: "calc(var(--template-frame-height, 0px) + 28px)",
			}}
		>
			<Container maxWidth="lg">
				<StyledToolbar
					variant="dense"
					disableGutters
					mode={mode}
				>
					<Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", px: 0 }}>
						<img
							src={logoSrc}
							alt="Prism Logo"
							style={{
								height: "auto",
								width: "auto",
								marginRight: "10px",
								maxHeight: "32px",
							}}
						/>
						<Box sx={{ display: { xs: "none", md: "flex" } }}>
							<Button
								variant="text"
								color="info"
								size="large"
								onClick={() => handleScroll("features")}
							>
								Features
							</Button>
							<Button
								variant="text"
								color="info"
								size="large"
								onClick={() => handleScroll("highlights")}
							>
								Highlights
							</Button>
							<Button
								variant="text"
								color="info"
								size="large"
								onClick={() => handleScroll("faq")}
							>
								FAQ
							</Button>
							<Button
								variant="text"
								color="info"
								size="large"
								href="https://uprock.com/blog"
							>
								Blog
							</Button>
						</Box>
					</Box>
					<Box
						sx={{
							display: { xs: "none", md: "flex" },
							gap: 1,
							alignItems: "center",
						}}
					>
						{/* <Button color="primary" variant="text" size="small">
              Sign in
            </Button>
            <Button color="primary" variant="contained" size="small">
              Sign up
            </Button> */}
					</Box>
					<Box
						sx={{
							display: { xs: "flex", md: "none" },

							gap: 1,
						}}
					>
						<IconButton
							aria-label="Menu button"
							onClick={toggleDrawer(true)}
						>
							<MenuIcon sx={{ color: theme.palette.text.primary }} />
						</IconButton>
						<Drawer
							anchor="top"
							open={open}
							onClose={toggleDrawer(false)}
							PaperProps={{
								sx: {
									top: 0,
									marginTop: 0,
									borderRadius: 0,
									backgroundColor: theme.palette.background.paper,
								},
							}}
						>
							<Box sx={{ p: 4, backgroundColor: theme.palette.background.main }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "flex-end",
									}}
								>
									<IconButton onClick={toggleDrawer(false)}>
										<CloseRoundedIcon sx={{ color: theme.palette.text.primary }} />
									</IconButton>
								</Box>

								<StyledMenuItem>Features</StyledMenuItem>
								<StyledMenuItem>Testimonials</StyledMenuItem>
								<StyledMenuItem>Highlights</StyledMenuItem>
								<StyledMenuItem>FAQ</StyledMenuItem>
								<StyledMenuItem
									component="a"
									href="https://uprock.com/blog"
								>
									Blog
								</StyledMenuItem>
								{/* <MenuItem>
                  <Button color="primary" variant="contained" fullWidth>
                    Sign up
                  </Button>
                </MenuItem>
                <MenuItem>
                  <Button color="primary" variant="outlined" fullWidth>
                    Sign in
                  </Button>
                </MenuItem> */}
							</Box>
						</Drawer>
					</Box>
					<ThemeSwitch />
				</StyledToolbar>
			</Container>
		</AppBar>
	);
};

export default AppAppBar;
