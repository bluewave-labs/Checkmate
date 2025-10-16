import React from "react";
import AppBar from "@/Components/v1/Common/AppBar.jsx";
import Footer from "@/Components/v1/Common/Footer.jsx";
import { useTranslation } from "react-i18next";

const AboutUs = () => {
	const { t } = useTranslation();

	return (
		<div>
			<AppBar />
			<h1>{t("aboutus")}</h1>
			<Footer />
		</div>
	);
};

export default AboutUs;
