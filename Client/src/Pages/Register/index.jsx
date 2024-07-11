import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./index.css";
import BackgroundPattern from "../../Components/BackgroundPattern/BackgroundPattern";
import Logomark from "../../assets/Images/Logomark.png";
import EmailTextField from "../../Components/TextFields/Email/EmailTextField";
import PasswordTextField from "../../Components/TextFields/Password/PasswordTextField";
import StringTextField from "../../Components/TextFields/Text/TextField";
import Check from "../../Components/Check/Check";
import Button from "../../Components/Button";
import Google from "../../assets/Images/Google.png";
import { registerValidation } from "../../Validation/validation";

import { useDispatch } from "react-redux";
import { register } from "../../Features/Auth/authSlice";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // TODO If possible, change the IDs of these fields to match the backend
  const idMap = {
    "register-firstname-input": "firstname",
    "register-lastname-input": "lastname",
    "register-email-input": "email",
    "register-password-input": "password",
  };

  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const { error } = registerValidation.validate(form, {
      abortEarly: false,
    });

    if (error) {
      // Creates an error object in the format { field: message }
      const validationErrors = error.details.reduce((acc, err) => {
        return { ...acc, [err.path[0]]: err.message };
      }, {});
      setErrors(validationErrors);
    } else {
      setErrors({});
    }
  }, [form]);

  const handleInput = (e) => {
    const newForm = { ...form, [idMap[e.target.id]]: e.target.value };
    setForm(newForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerValidation.validateAsync(form, { abortEarly: false });
      const action = await dispatch(register(form));

      if (action.meta.requestStatus === "fulfilled") {
        const token = action.payload.data;
        localStorage.setItem("token", token);
        navigate("/");
      }

      if (action.meta.requestStatus === "rejected") {
        const error = new Error("Request rejected");
        error.response = action.payload;
        throw error;
      }
    } catch (error) {
      if (error.name === "ValidationError") {
        // TODO Handle validation errors
        console.log(error);
        alert(error);
      } else if (error.response) {
        // TODO handle dispatch errors
        alert(error.response.msg);
      } else {
        // TODO handle unknown errors
        console.log(error);
        alert("Unknown error");
      }
    }
  };

  return (
    <div className="register-page">
      <BackgroundPattern></BackgroundPattern>
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="register-form-header">
          <img
            className="register-form-header-logo"
            src={Logomark}
            alt="Logomark"
          />
          <div className="register-form-v-spacing-large" />
          <div className="register-form-heading">Create an account</div>
          <div className="register-form-v-spacing-large"></div>
        </div>
        <div className="register-form-v-spacing-40px" />
        <div className="register-form-inputs">
          <StringTextField
            onChange={handleInput}
            error={errors.firstname ? true : false}
            helperText={errors.firstname ? errors.firstname : ""}
            label="First name*"
            placeholder="Enter your first name"
            id="register-firstname-input"
          />
          <div className="login-form-v2-spacing" />
          <StringTextField
            onChange={handleInput}
            error={errors.lastname ? true : false}
            helperText={errors.lastname ? errors.lastname : ""}
            label="Last name*"
            placeholder="Enter your last name"
            id="register-lastname-input"
          />
          <div className="login-form-v2-spacing" />
          <EmailTextField
            onChange={handleInput}
            label="Email*"
            error={errors.email ? true : false}
            helperText={errors.email ? errors.email : ""}
            placeholder="Enter your email"
            autoComplete="email"
            id="register-email-input"
          />
          <div className="login-form-v2-spacing" />
          <PasswordTextField
            onChange={handleInput}
            label="Password*"
            error={errors.password ? true : false}
            helperText={errors.password ? errors.password : ""}
            placeholder="Create a password"
            autoComplete="current-password"
            id="register-password-input"
          />
        </div>
        <div className="login-form-v2-spacing" />
        <div className="register-form-checks">
          <Check text="Must be at least 8 characters" />
          <div className="register-form-v-spacing-small"></div>
          <Check text="Must contain one special character, one number and one uppercase" />
        </div>
        <div className="login-form-v2-spacing" />
        <div className="register-form-actions">
          <Button
            type="submit"
            level="primary"
            label="Get started"
            sx={{ width: "100%" }}
          />
          <div className="login-form-v-spacing" />
          <Button
            disabled={true}
            level="secondary"
            label="Sign up with Google"
            sx={{ width: "100%", color: "#344054", fontWeight: "700" }}
            img={<img className="google-enter" src={Google} alt="Google" />}
          />
        </div>
      </form>
      <div className="register-bottom-spacing"></div>
    </div>
  );
};

export default Register;
