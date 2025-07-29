import Monitor from "../../models/Monitor.js";
import Check from "../../models/Check.js";
import { logger } from "../../../utils/logger.js";

const generateRandomUrl = () => {
	const domains = ["example.com", "test.org", "demo.net", "sample.io", "mock.dev"];
	const paths = ["api", "status", "health", "ping", "check"];
	return `https://${domains[Math.floor(Math.random() * domains.length)]}/${paths[Math.floor(Math.random() * paths.length)]}`;
};

const generateChecks = (monitorId, teamId, count) => {
	const checks = [];
	const endTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
	const startTime = new Date(endTime - count * 60 * 1000); // count minutes before endTime

	for (let i = 0; i < count; i++) {
		const timestamp = new Date(startTime.getTime() + i * 60 * 1000);
		const status = Math.random() > 0.05; // 95% chance of being up

		checks.push({
			monitorId,
			teamId,
			status,
			responseTime: Math.floor(Math.random() * 1000), // Random response time between 0-1000ms
			createdAt: timestamp,
			updatedAt: timestamp,
		});
	}

	return checks;
};

const seedDb = async (userId, teamId) => {
	try {
		logger.info({
			message: "Deleting all monitors and checks",
			service: "seedDb",
			method: "seedDb",
		});
		await Monitor.deleteMany({});
		await Check.deleteMany({});
		logger.info({
			message: "Adding monitors",
			service: "DB",
			method: "seedDb",
		});
		for (let i = 0; i < 300; i++) {
			const monitor = await Monitor.create({
				name: `Monitor ${i}`,
				url: generateRandomUrl(),
				type: "http",
				userId,
				teamId,
				interval: 60000,
				active: false,
			});
			logger.info({
				message: `Adding monitor and checks for monitor ${i}`,
				service: "DB",
				method: "seedDb",
			});
			const checks = generateChecks(monitor._id, teamId, 10000);
			await Check.insertMany(checks);
		}
	} catch (error) {
		logger.error({
			message: "Error seeding DB",
			service: "DB",
			method: "seedDb",
			stack: error.stack,
		});
	}
};

export default seedDb;
