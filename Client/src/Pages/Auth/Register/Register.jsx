import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@emotion/react";
import { Stack, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";

import "../index.css";
import background from "../../../assets/Images/background_pattern_decorative.png";
import Logomark from "../../../assets/Images/bwl-logo-2.svg?react";
import Check from "../../../Components/Check/Check";
import Button from "../../../Components/Button";
import { credentials } from "../../../Validation/validation";
import { createToast } from "../../../Utils/toastUtils";
import Field from "../../../Components/Inputs/Field";
import { register } from "../../../Features/Auth/authSlice";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../Utils/axiosConfig";

const Register = ({ isAdmin }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const theme = useTheme();
  // TODO If possible, change the IDs of these fields to match the backend
  const idMap = {
    "register-firstname-input": "firstName",
    "register-lastname-input": "lastName",
    "register-email-input": "email",
    "register-password-input": "password",
    "register-confirm-input": "confirm",
  };

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
    role: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchInvite = async () => {
      if (token !== undefined) {
        try {
          const res = await axiosInstance.post(`/auth/invite/verify`, {
            token,
          });
          const { role, email } = res.data.data;
          console.log(role);
          setForm({ ...form, email, role });
        } catch (error) {
          console.log(error);
        }
      }
    };
    fetchInvite();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const registerForm = { ...form, role: isAdmin ? ["admin"] : form.role };
    const { error } = credentials.validate(registerForm, {
      abortEarly: false,
      context: { password: form.password },
    });

    if (error) {
      // validation errors
      const newErrors = {};
      error.details.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      createToast({
        body:
          error.details && error.details.length > 0
            ? error.details[0].message
            : "Error validating data.",
      });
    } else {
      delete registerForm.confirm;
      const action = await dispatch(register(registerForm));
      if (action.payload.success) {
        const token = action.payload.data;
        localStorage.setItem("token", token);
        navigate("/");
        createToast({
          body: "Welcome! Your account was created successfully.",
        });
      } else {
        if (action.payload) {
          // dispatch errors
          createToast({
            body: action.payload.msg,
          });
        } else {
          // unknown errors
          createToast({
            body: "Unknown error.",
          });
        }
      }
    }
  };

  const handleChange = (event) => {
    const { value, id } = event.target;
    const name = idMap[id];
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    const { error } = credentials.validate(
      { [name]: value },
      { abortEarly: false, context: { password: form.password } }
    );

    setErrors((prev) => {
      const prevErrors = { ...prev };
      if (error) prevErrors[name] = error.details[0].message;
      else delete prevErrors[name];
      return prevErrors;
    });
  };

  return (
    <div className="register-page">
      <img
        className="background-pattern-svg"
        src={background}
        alt="background pattern"
      />
      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <Stack gap={theme.gap.small} alignItems="center">
          <Logomark alt="BlueWave Uptime Icon" />
          <Typography component="h1" sx={{ mt: theme.gap.xl }}>
            Create{isAdmin ? " admin " : " "}account
          </Typography>
        </Stack>
        <Stack gap={theme.gap.large} sx={{ mt: `calc(${theme.gap.ml}*2)` }}>
          <Field
            id="register-firstname-input"
            label="Name"
            isRequired={true}
            placeholder="Daniel"
            autoComplete="given-name"
            value={form.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />
          <Field
            id="register-lastname-input"
            label="Surname"
            isRequired={true}
            placeholder="Cojocea"
            autoComplete="family-name"
            value={form.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />
          <Field
            type="email"
            id="register-email-input"
            label="Email"
            isRequired={true}
            placeholder="daniel.cojocea@domain.com"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Field
            type="password"
            id="register-password-input"
            label="Password"
            isRequired={true}
            placeholder="Create a password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <Field
            type="password"
            id="register-confirm-input"
            label="Confirm password"
            isRequired={true}
            placeholder="Confirm your password"
            autoComplete="current-password"
            value={form.confirm}
            onChange={handleChange}
            error={errors.confirm}
          />
          <Stack gap={theme.gap.small}>
            <Check
              text="Must be at least 8 characters long"
              variant={
                errors?.password === "Password is required"
                  ? "error"
                  : form.password === ""
                  ? "info"
                  : form.password.length < 8
                  ? "error"
                  : "success"
              }
            />
            <Check
              text="Must contain one special character and a number"
              variant={
                errors?.password === "Password is required"
                  ? "error"
                  : form.password === ""
                  ? "info"
                  : !/^(?=.*[!@#$%^&*(),.?":{}|])(?=.*\d).+$/.test(
                      form.password
                    )
                  ? "error"
                  : "success"
              }
            />
            <Check
              text="Must contain at least one upper and lower character"
              variant={
                errors?.password === "Password is required"
                  ? "error"
                  : form.password === ""
                  ? "info"
                  : !/^(?=.*[A-Z])(?=.*[a-z]).+$/.test(form.password)
                  ? "error"
                  : "success"
              }
            />
          </Stack>
          <Button
            type="submit"
            level="primary"
            label="Get started"
            sx={{ marginBottom: theme.gap.large }}
            disabled={Object.keys(errors).length !== 0 && true}
          />
        </Stack>
      </form>
    </div>
  );
};
Register.propTypes = {
  isAdmin: PropTypes.bool,
};
export default Register;
