import { Avatar as MuiAvatar } from "@mui/material";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import type { RootState } from "@/Types/state";

interface AvatarProps {
	src?: string;
	small?: boolean;
	sx?: object;
	onClick?: Function;
}

export const Avatar = ({ src, small, sx, onClick = () => {} }: AvatarProps) => {
	const { user } = useSelector((state: RootState) => state.auth);
	const theme = useTheme();
	if (!user) return null;

	const style = small ? { width: 32, height: 32 } : { width: 64, height: 64 };
	const border = small ? 1 : 3;

	const [image, setImage] = useState<string>();
	useEffect(() => {
		if (user.avatarImage) {
			setImage(`data:image/png;base64,${user.avatarImage}`);
		}
	}, [user?.avatarImage]);

	return (
		<MuiAvatar
			onClick={onClick}
			alt={`${user?.firstName} ${user?.lastName}`}
			src={src ? src : user?.avatarImage ? image : undefined}
			sx={{
				fontSize: small ? "16px" : "22px",
				fontWeight: 400,
				backgroundColor: theme.palette.primary.main,
				display: "inline-flex",

				...style,
				...sx,
			}}
		>
			{user.firstName?.charAt(0)}
			{user.lastName?.charAt(0) || ""}
		</MuiAvatar>
	);
};
