import React from "react";
import { Step, Stepper, StepLabel, Typography } from "@mui/material";
import Icon from "../Icon";
import PropTypes from "prop-types";

const CustomStepIcon = (props) => {
	const { completed, active } = props;
	return completed ? (
		<Icon
			name="CheckCircle2"
			size={24}
			color="accent.main"
		/>
	) : (
		<Icon
			name="Circle"
			size={24}
			color={active ? "accent.main" : "text.disabled"}
		/>
	);
};

CustomStepIcon.propTypes = {
	completed: PropTypes.bool.isRequired,
	active: PropTypes.bool.isRequired,
};

/**
 * @component
 * @param {Object} props
 * @param {Array} props.steps
 */

const ProgressStepper = ({ steps }) => {
	const [activeStep, setActiveStep] = React.useState(1);
	return (
		<Stepper
			activeStep={activeStep}
			alternativeLabel
		>
			{steps.map((step, index) => {
				const color = activeStep === index ? "primary" : "inherit";
				return (
					<Step
						key={step.label}
						onClick={() => setActiveStep(index)}
					>
						<StepLabel StepIconComponent={CustomStepIcon}>
							<Typography
								variant="body1"
								color={color}
								sx={{ fontWeight: "bold" }}
							>
								{step.label}
							</Typography>
						</StepLabel>
						<Typography
							variant="body1"
							color={color}
						>
							{step.content}
						</Typography>
					</Step>
				);
			})}
		</Stepper>
	);
};

ProgressStepper.propTypes = {
	steps: PropTypes.array.isRequired,
};

export default ProgressStepper;
