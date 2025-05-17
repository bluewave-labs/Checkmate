import Sidebar from "../../Sidebar";
import { useRef } from "react";
import { Outlet } from "react-router";
import { Stack } from "@mui/material";
import { DialogAnchorProvider } from "../../../Utils/DialogAnchorProvider";

import "./index.css";

const HomeLayout = () => {
	const dialogAnchorRef = useRef(null);

	return (
		<Stack
			className="home-layout"
			flexDirection="row"
		>
			<Sidebar />
			<DialogAnchorProvider anchor={dialogAnchorRef}>
				<Stack
					className="home-content-wrapper"
					ref={dialogAnchorRef}
					sx={{
						position: "relative"
					}}
				>
					<Outlet />
				</Stack>
			</DialogAnchorProvider>
		</Stack>
	);
};

export default HomeLayout;
