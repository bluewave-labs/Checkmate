// **************************
// The idea here is to provide a layer of abstraction between the database and whoever is using it.
// Instead of directly calling mongoose methods, we can call the methods on the DB object.
// If this were Typescript or Java or Golang an interface would be implemented to ensure the methods are available.
// But we do the best we can with Javascript.
//
// If the methods are consistent all we have to do to swap out one DB for another is simply change the import.
//
// Example:
// We start with the fake DB:
//
// const db = require("../db/FakeDb");
// const monitors = await db.getAllMonitors();
//
// And when we want to swtich to a real DB, all we have to do is swap the import
//
// const db = require("../db/MongoDb");
// const monitors = await db.getAllMonitors();
//
// The rest of the code is the same, as all the `db` methods are standardized.
// **************************

const Monitor = require("./models/Monitor");
const UserModel = require("./models/User");
const bcrypt = require("bcrypt");

let FAKE_MONITOR_DATA = [];
const USERS = [];

const connect = async () => {
	try {
		await console.log("Connected to FakeDB");
	} catch (error) {
		console.error(error);
	}
};

const insertUser = async (req, res) => {
	try {
		const newUser = new UserModel({ ...req.body });
		const salt = await bcrypt.genSalt(10); //genSalt is asynchronous, need to wait
		newUser.password = await bcrypt.hash(newUser.password, salt); // hash is also async, need to eitehr await or use hashSync
		USERS.push(newUser);
		const userToReturn = { ...newUser._doc };
		delete userToReturn.password;
		return userToReturn;
	} catch (error) {
		throw error;
	}
};

const getUserByEmail = async (req, res) => {
	const email = req.body.email;
	try {
		const idx = USERS.findIndex((user) => {
			return user.email === email;
		});
		if (idx === -1) {
			return null;
		}
		return USERS[idx];
	} catch (error) {
		throw new Error(`User with email ${email} not found`);
	}
};

const getAllMonitors = async () => {
	return FAKE_MONITOR_DATA;
};

const getMonitorById = async (monitorId) => {
	const idx = FAKE_MONITOR_DATA.findIndex((monitor) => {
		return monitor.id === monitorId;
	});
	if (idx === -1) {
		throw new Error(`Monitor with id ${monitorId} not found`);
	}
	return FAKE_MONITOR_DATA[idx];
};

const getMonitorsByUserId = async (userId) => {
	const userMonitors = FAKE_MONITOR_DATA.filter((monitor) => {
		return monitor.userId === userId;
	});

	if (userMonitors.length === 0) {
		throw new Error(`Monitors for user ${userId} not found`);
	}
	return userMonitors;
};

const createMonitor = async (req, res) => {
	const monitor = new Monitor(req.body);
	monitor.createdAt = Date.now();
	monitor.updatedAt = Date.now();
	FAKE_MONITOR_DATA.push(monitor);
	return monitor;
};

const deleteMonitor = async (req, res) => {
	const monitorId = req.params.monitorId;
	try {
		const monitor = getMonitorById(monitorId);
		FAKE_MONITOR_DATA = FAKE_MONITOR_DATA.filter((monitor) => {
			return monitor.id !== monitorId;
		});
		return monitor;
	} catch (error) {
		throw error;
	}
};

const editMonitor = async (req, res) => {
	const monitorId = req.params.monitorId;
	const idx = FAKE_MONITOR_DATA.findIndex((monitor) => {
		return monitor._id.toString() === monitorId;
	});
	const oldMonitor = FAKE_MONITOR_DATA[idx];
	const editedMonitor = new Monitor({ ...req.body });
	editedMonitor._id = oldMonitor._id;
	editedMonitor.userId = oldMonitor.userId;
	editedMonitor.updatedAt = Date.now();
	editedMonitor.createdAt = oldMonitor.createdAt;
	FAKE_MONITOR_DATA[idx] = editedMonitor;
	return FAKE_MONITOR_DATA[idx];
};

module.exports = {
	connect,
	insertUser,
	getUserByEmail,
	getAllMonitors,
	getMonitorById,
	getMonitorsByUserId,
	createMonitor,
	deleteMonitor,
	editMonitor,
};
