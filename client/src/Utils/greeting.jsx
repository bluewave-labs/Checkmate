import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { setGreeting } from "../Features/UI/uiSlice";

const early = [
	{
		prepend: "Rise and shine",
		append: "If you’re up this early, you might as well be a legend!",
		emoji: "☕",
	},
	{
		prepend: "Good morning",
		append: "The world’s still asleep, but you’re already awesome!",
		emoji: "🦉",
	},
	{
		prepend: "Good morning",
		append: "Are you a wizard? Only magical people are up at this hour!",
		emoji: "🌄",
	},
	{
		prepend: "Up before the roosters",
		append: "Ready to tackle the day before it even starts?",
		emoji: "🐓",
	},
	{
		prepend: "Early bird special",
		append: "Let’s get things done while everyone else is snoozing!",
		emoji: "🌟",
	},
];

const morning = [
	{
		prepend: "Good morning",
		append: "Is it coffee o’clock yet, or should we start with high fives?",
		emoji: "☕",
	},
	{
		prepend: "Morning",
		append: "The sun is up, and so are you—time to be amazing!",
		emoji: "🌞",
	},
	{
		prepend: "Good morning",
		append: "Time to make today the best thing since sliced bread!",
		emoji: "🥐",
	},
	{
		prepend: "Morning",
		append: "Let’s kick off the day with more energy than a double espresso!",
		emoji: "🚀",
	},
	{
		prepend: "Rise and shine",
		append: "You’re about to make today so great, even Monday will be jealous!",
		emoji: "🌟",
	},
];

const afternoon = [
	{
		prepend: "Good afternoon",
		append: "How about a break to celebrate how awesome you’re doing?",
		emoji: "🥪",
	},
	{
		prepend: "Afternoon",
		append: "If you’re still going strong, you’re officially a rockstar!",
		emoji: "🌞",
	},
	{
		prepend: "Hey there",
		append: "The afternoon is your playground—let’s make it epic!",
		emoji: "🍕",
	},
	{
		prepend: "Good afternoon",
		append: "Time to crush the rest of the day like a pro!",
		emoji: "🏆",
	},
	{
		prepend: "Afternoon",
		append: "Time to turn those afternoon slumps into afternoon triumphs!",
		emoji: "🎉",
	},
];

const evening = [
	{
		prepend: "Good evening",
		append: "Time to wind down and think about how you crushed today!",
		emoji: "🌇",
	},
	{
		prepend: "Evening",
		append: "You’ve earned a break—let’s make the most of these evening vibes!",
		emoji: "🍹",
	},
	{
		prepend: "Hey there",
		append: "Time to relax and bask in the glow of your day’s awesomeness!",
		emoji: "🌙",
	},
	{
		prepend: "Good evening",
		append: "Ready to trade productivity for chill mode?",
		emoji: "🛋️ ",
	},
	{
		prepend: "Evening",
		append: "Let’s call it a day and toast to your success!",
		emoji: "🕶️",
	},
];

/**
 * Greeting component that displays a personalized greeting message
 * based on the time of day and the user's first name.
 *
 * @component
 * @example
 * return <Greeting type={"pagespeed"} />;
 *
 * @param {Object} props
 * @param {string} props.type - The type of monitor to be displayed in the message
 * @returns {JSX.Element} The rendered Greeting component
 */

const Greeting = ({ type = "" }) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const { firstName } = useSelector((state) => state.auth.user);
	const index = useSelector((state) => state.ui.greeting?.index ?? 0);
	const lastUpdate = useSelector((state) => state.ui.greeting?.lastUpdate ?? null);

	const now = new Date();
	const hour = now.getHours();

	useEffect(() => {
		const hourDiff = lastUpdate ? hour - lastUpdate : null;

		if (!lastUpdate || hourDiff >= 1) {
			let random = Math.floor(Math.random() * 5);
			dispatch(setGreeting({ index: random, lastUpdate: hour }));
		}
	}, [dispatch, hour, lastUpdate]);

	let greetingArray =
		hour < 6 ? early : hour < 12 ? morning : hour < 18 ? afternoon : evening;
	const { prepend, append, emoji } = greetingArray[index];

	return (
		<Box>
			<Typography
				component="h1"
				variant="h1"
				mb={theme.spacing(1)}
			>
				<Typography
					component="span"
					fontSize="inherit"
					color={theme.palette.primary.contrastTextTertiary}
				>
					{t("greeting.prepend", { defaultValue: prepend })},{" "}
				</Typography>
				<Typography
					component="span"
					fontSize="inherit"
					fontWeight="inherit"
					color={theme.palette.primary.contrastTextSecondary}
				>
					{firstName} {emoji}
				</Typography>
			</Typography>
			<Typography
				variant="h2"
				lineHeight={1}
				color={theme.palette.primary.contrastTextTertiary}
			>
				{t("greeting.append", { defaultValue: append })} —{" "}
				{t("greeting.overview", { type: t(`menu.${type}`) })}
			</Typography>
		</Box>
	);
};

Greeting.propTypes = {
	type: PropTypes.string,
};

export default Greeting;
