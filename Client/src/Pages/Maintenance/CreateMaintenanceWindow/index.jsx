import { Box, Stack, Typography } from "@mui/material";
import "./index.css";
import { useState } from "react";
import Button from "../../../Components/Button";
import Back from "../../../assets/icons/left-arrow-long.svg?react";
import Select from "../../../Components/Inputs/Select";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import Field from "../../../Components/Inputs/Field";
import { maintenanceWindowValidation } from "../../../Validation/validation";
import { logger } from "../../../Utils/Logger";
import { createToast } from "../../../Utils/toastUtils";
import { useTheme } from "@emotion/react";

const directory = {
  title: "Create a maintenance window",
  description: "Your pings won’t be sent in this time frame.",
};

const repeatOptions = [
  { _id: 1, name: "Don't repeat" },
  { _id: 2, name: "Repeat daily" },
  { _id: 3, name: "Repeat weekly" },
];

const configOptionTitle = (title, description) => {
  return (
    <Stack width="40%" gap={1}>
      <Typography
        style={{
          fontWeight: 600,
          fontSize: "var(--env-var-font-size-medium)",
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          style={{
            fontSize: "var(--env-var-font-size-small)",
          }}
        >
          {description}
        </Typography>
      )}
    </Stack>
  );
};

const durationOptions = [
  { _id: "minutes", name: "minutes" },
  { _id: "hours", name: "hours" },
  { _id: "days", name: "days" },
];

const CreateNewMaintenanceWindow = () => {
  const theme = useTheme();

  const [values, setValues] = useState({
    repeat: 1,
    date: dayjs(),
    startTime: dayjs(),
    duration: "60",
    unit: "minutes",
    displayName: "",
    AddMonitors: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event, name) => {
    const { value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const data = {
      repeat: values.repeat,
      date: values.date.format("YYYY-MM-DD"),
      startTime: values.startTime.format("HH:mm"),
      duration: values.duration,
      unit: values.unit,
      displayName: values.displayName,
      addMonitors: values.AddMonitors,
    };

    const { error } = maintenanceWindowValidation.validate(data, {
      abortEarly: false,
    });
    logger.log("error: ", error);
    if (!error || error.details.length === 0) {
      setErrors({});
    } else {
      const newErrors = {};
      error.details.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      createToast({
        body:
          error.details && error.details.length > 0
            ? error.details[0].message
            : "Error validating data",
      });
      logger.error("Validation errors:", error.details);
    }

    logger.log("Submitting data: ", data);
  };

  const configOptions = [
    {
      title: "Repeat",
      component: (
        <Select
          onChange={(e) => handleChange(e, "repeat")}
          id="repeat-mode"
          items={repeatOptions}
          value={values.repeat}
        />
      ),
    },
    {
      title: "Date",
      component: (
        <LocalizationProvider
          className="date-localization-provider"
          dateAdapter={AdapterDayjs}
        >
          <DatePicker
            className="date-picker"
            defaultValue={values.date}
            onChange={(date) =>
              handleChange({ target: { value: date } }, "date")
            }
          />
        </LocalizationProvider>
      ),
    },
    {
      title: "Start time",
      component: (
        <LocalizationProvider
          className="time-localization-provider"
          dateAdapter={AdapterDayjs}
        >
          <MobileTimePicker
            className="time-picker"
            defaultValue={values.startTime}
            onChange={(time) =>
              handleChange({ target: { value: time } }, "startTime")
            }
          />
        </LocalizationProvider>
      ),
    },
    {
      title: "Duration",
      component: (
        <Stack
          className="duration-config"
          gap={theme.spacing(5)}
          direction="row"
        >
          <Field
            id="duration-value"
            placeholder="60"
            onChange={(e) => handleChange(e, "duration")}
            value={values.duration}
            error={errors.duration}
            type="number"
          />
          <Select
            onChange={(e) => handleChange(e, "unit")}
            id="duration-unit"
            items={durationOptions}
            value={values.unit}
          />
        </Stack>
      ),
    },
    {
      title: "Display name",
      component: (
        <Field
          id="display-name"
          placeholder="Maintanence at __ : __ for ___ minutes"
          value={values.displayName}
          onChange={(e) => handleChange(e, "displayName")}
          error={errors.displayName}
        />
      ),
    },
    {
      title: "Add monitors",
      component: (
        <Stack
          className="add-monitors-fields"
          sx={{ width: "60%", maxWidth: "380px" }}
          gap={theme.spacing(5)}
        >
          <Field
            id="add-monitors"
            placeholder="Start typing to search for current monitors"
            value={values.AddMonitors}
            onChange={(e) => handleChange(e, "AddMonitors")}
            error={errors.addMonitors}
          />
          <Typography
            sx={{
              width: "fit-content",
              fontSize: "var(--env-var-font-size-small)",
              borderBottom: `1px dashed ${theme.palette.common.main}`,
              paddingBottom: "4px",
            }}
          >
            Add all monitors to this maintenance window
          </Typography>
        </Stack>
      ),
    },
  ];

  return (
    <div className="create-maintenance-window">
      <Stack gap={theme.spacing(10)}>
        <Button
          id="btn-back"
          sx={{
            width: "100px",
            height: "30px",
            gap: "10px",
            backgroundColor: theme.palette.background.fill,
            color: theme.palette.text.secondary,
          }}
          label="Back"
          level="tertiary"
          img={<Back />}
        />
        <Box>
          <Typography
            sx={{
              fontSize: "var(--env-var-font-size-large)",
              fontWeight: 600,
              color: theme.palette.text.secondary,
            }}
          >
            {directory.title}
          </Typography>

          <Typography sx={{ fontSize: "var(--env-var-font-size-medium)" }}>
            {directory.description}
          </Typography>
        </Box>
        <Stack
          className="maintenance-options"
          gap={theme.spacing(20)}
          paddingY={theme.spacing(15)}
          paddingX={theme.spacing(20)}
          sx={{
            border: 1,
            borderColor: theme.palette.border.light,
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.background.main,
          }}
        >
          {configOptions.map((item, index) => (
            <Stack key={index} display="-webkit-inline-box">
              {item.title && configOptionTitle(item.title, item.description)}
              {item.component && item.component}
            </Stack>
          ))}
        </Stack>
        <Stack justifyContent="end" direction="row" marginTop={3}>
          <Button
            sx={{
              "&:hover": {
                backgroundColor: "transparent",
                boxShadow: "none",
              },
            }}
            level="tertiary"
            label="Cancel"
          />
          <Button
            sx={{
              "&:hover": {
                backgroundColor: "#1570EF",
                boxShadow: "none",
              },
            }}
            level="primary"
            label="Create"
            onClick={handleSubmit}
          />
        </Stack>
      </Stack>
    </div>
  );
};

export default CreateNewMaintenanceWindow;
