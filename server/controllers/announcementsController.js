import { createAnnouncementValidation } from "../validation/joi.js";
import { asyncHandler } from "../utils/errorUtils.js";

const SERVICE_NAME = "announcementController";

/**
 * Controller for managing announcements in the system.
 * This class handles the creation of new announcements.
 *
 * @class AnnouncementController
 */

class AnnouncementController {
	constructor(db, stringService) {
		this.db = db;
		this.stringService = stringService;
		this.createAnnouncement = this.createAnnouncement.bind(this);
		this.getAnnouncement = this.getAnnouncement.bind(this);
	}

	/**
	 * Handles the creation of a new announcement.
	 *
	 * @async
	 * @param {Object} req - The request object, containing the announcement data in the body.
	 * @param {Object} res - The response object used to send the result back to the client.
	 * @param {Function} next - The next middleware function in the stack for error handling.
	 *
	 * @returns {Promise<void>} A promise that resolves once the response is sent.
	 */
	createAnnouncement = asyncHandler(
		async (req, res, next) => {
			await createAnnouncementValidation.validateAsync(req.body);
			const { title, message } = req.body;
			const announcementData = {
				title: title.trim(),
				message: message.trim(),
				userId: req.user._id,
			};

			const newAnnouncement = await this.db.createAnnouncement(announcementData);
			return res.success({
				msg: this.stringService.createAnnouncement,
				data: newAnnouncement,
			});
		},
		SERVICE_NAME,
		"createAnnouncement"
	);

	/**
	 * Handles retrieving announcements with pagination.
	 *
	 * @async
	 * @param {Object} res - The response object used to send the result back to the client.
	 *  - `data`: The list of announcements to be sent back to the client.
	 *  - `msg`: A message about the success of the request.
	 * @param {Function} next - The next middleware function in the stack for error handling.
	 */
	getAnnouncement = asyncHandler(
		async (req, res, next) => {
			const allAnnouncements = await this.db.getAnnouncements();
			return res.success({
				msg: this.stringService.getAnnouncement,
				data: allAnnouncements,
			});
		},
		SERVICE_NAME,
		"getAnnouncement"
	);
}

export default AnnouncementController;
