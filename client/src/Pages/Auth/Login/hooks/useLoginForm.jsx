import { useState } from "react";

const useLoginForm = () => {
	const [form, setForm] = useState({
		email: "",
		password: "",
	});
	const onChange = (e) => {
		let { name, value } = e.target;
		if (name === "email") {
			value = value.toLowerCase();
		}
		const updatedForm = { ...form, [name]: value };
		setForm(updatedForm);
	};
	return [form, onChange];
};

export default useLoginForm;
