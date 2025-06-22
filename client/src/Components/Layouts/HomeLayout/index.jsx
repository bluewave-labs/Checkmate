import Sidebar from "../../Sidebar";
import { useRef } from "react";
import { Outlet } from "react-router";
import { Stack } from "@mui/material";
import { DialogAnchorContext } from "../../../Utils/DialogAnchorContext";

import "./index.css";

const HomeLayout = () => {
	const dialogAnchorRef = useRef(null);

	return (
		<Stack
			className="home-layout"
			flexDirection="row"
		>
			<Sidebar />
			<DialogAnchorContext.Provider value={dialogAnchorRef}>
				<Stack
					className="home-content-wrapper"
					ref={dialogAnchorRef}
					sx={{
						position: "relative"
					}}
				>
					<Outlet />
				</Stack>
			</DialogAnchorContext.Provider>
		</Stack>
	);
};

export default HomeLayout;
