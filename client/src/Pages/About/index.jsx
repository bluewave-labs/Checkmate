import React from "react";
import AppBar from "../../Components/Common/AppBar";
import Footer from "../../Components/Common/Footer";
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
