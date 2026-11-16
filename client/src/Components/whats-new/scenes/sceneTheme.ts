import { useEffect, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";

// Illustration canvas, in SVG user units
export const SCENE_WIDTH = 640;
export const SCENE_HEIGHT = 300;
// Seconds the reduced-motion frame is taken before the end, after every reveal has settled
const REDUCED_MOTION_OFFSET = 0.6;
// Seconds over which the loop fades out before it restarts
export const LOOP_FADE = 0.35;

// Colours for the illustrations, taken from the theme so they follow light and dark mode
export const useScenePalette = () => {
	const theme = useTheme();
	const { palette } = theme;
	return {
		ink: palette.text.primary,
		text: palette.text.secondary,
		muted: palette.text.disabled,
		line: palette.divider,
		card: palette.background.paper,
		surface: palette.background.default,
		fill: alpha(palette.text.primary, 0.06),
		primary: palette.primary.main,
		onPrimary: palette.primary.contrastText,
		primarySoft: alpha(palette.primary.main, 0.1),
		primaryTint: alpha(palette.primary.main, 0.4),
		up: palette.success.main,
		upSoft: alpha(palette.success.main, 0.14),
		down: palette.error.main,
		downSoft: alpha(palette.error.main, 0.12),
		warning: palette.warning.main,
		terminal: palette.grey[900],
		terminalText: palette.grey[300],
		terminalMuted: palette.grey[500],
		terminalAccent: alpha(palette.primary.light, 0.9),
		shadow: palette.common.black,
		fontFamily: theme.typography.fontFamily,
	};
};

export type ScenePalette = ReturnType<typeof useScenePalette>;

// Elapsed scene time in seconds, looping. With reduced motion the scene holds its final frame.
export const useSceneClock = (duration: number, reducedMotion: boolean) => {
	const [time, setTime] = useState(reducedMotion ? duration - REDUCED_MOTION_OFFSET : 0);

	useEffect(() => {
		if (reducedMotion) {
			setTime(duration - REDUCED_MOTION_OFFSET);
			return;
		}
		let frame = 0;
		let start: number | null = null;
		const tick = (now: number) => {
			if (start === null) start = now;
			setTime(((now - start) / 1000) % duration);
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [duration, reducedMotion]);

	return time;
};

export const SHADOW = "url(#whats-new-shadow)";

// Width of a label in SVG user units. Boxes around translated text (buttons, pills, selects) are
// sized from this so longer languages don't overflow them.
let measureContext: CanvasRenderingContext2D | null | undefined;
const AVERAGE_GLYPH_WIDTH = 0.56;

export const useMeasureText = () => {
	const { fontFamily } = useScenePalette();
	return (text: string, fontSize: number, fontWeight: number = 400) => {
		if (measureContext === undefined) {
			measureContext =
				typeof document === "undefined"
					? null
					: document.createElement("canvas").getContext("2d");
		}
		if (!measureContext) return text.length * fontSize * AVERAGE_GLYPH_WIDTH;
		measureContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
		return measureContext.measureText(text).width;
	};
};
