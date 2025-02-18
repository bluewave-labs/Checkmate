import AppBar from "../../Components/Common/AppBar";
import Footer from "../../Components/Common/Footer";
import Hero from "../../Components/Home/Hero";
import Features from "../../Components/Home/Features";
import Highlights from "../../Components/Home/Highlights";
import FAQ from "../../Components/Home/FAQ";
import Divider from "../../Components/Home/Divider";
import LogoCarousel from "../../Components/Home/LogoCarousel";

const Landing = () => {
	return (
		<div>
			<AppBar />
			<Hero />
			<LogoCarousel />
			<Divider />
			<div id="features">
				<Features />
			</div>
			<Divider />
			<div id="highlights">
				<Highlights />
			</div>
			<Divider />
			<div id="faq">
				<FAQ />
			</div>
			<Footer />
		</div>
	);
};

export default Landing;
