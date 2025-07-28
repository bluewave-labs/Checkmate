import BaseController from "./baseController.js";
import {
	registrationBodyValidation,
	loginValidation,
	editUserBodyValidation,
	recoveryValidation,
	recoveryTokenBodyValidation,
	newPasswordValidation,
	getUserByIdParamValidation,
	editUserByIdParamValidation,
	editUserByIdBodyValidation,
	editSuperadminUserByIdBodyValidation,
} from "../validation/joi.js";

const SERVICE_NAME = "authController";

/**
 * Authentication Controller
 *
 * Handles all authentication-related HTTP requests including user registration,
 * login, password recovery, and user management operations.
 *
 * @class AuthController
 * @description Manages user authentication and authorization operations
 */
class AuthController extends BaseController {
	static SERVICE_NAME = SERVICE_NAME;
	/**
	 * Creates an instance of AuthController.
	 *
	 * @param {Object} commonDependencies - Common dependencies injected into the controller
	 * @param {Object} dependencies - The dependencies required by the controller
	 * @param {Object} dependencies.settingsService - Service for application settings
	 * @param {Object} dependencies.emailService - Service for email operations
	 * @param {Object} dependencies.jobQueue - Service for job queue operations
	 * @param {Object} dependencies.userService - User business logic service
	 */
	constructor(commonDependencies, { settingsService, emailService, jobQueue, userService }) {
		super(commonDependencies);
		this.settingsService = settingsService;
		this.emailService = emailService;
		this.jobQueue = jobQueue;
		this.userService = userService;
	}

	get serviceName() {
		return AuthController.SERVICE_NAME;
	}

	/**
	 * Registers a new user in the system.
	 *
	 * @async
	 * @function registerUser
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing user registration data
	 * @param {string} req.body.firstName - User's first name
	 * @param {string} req.body.lastName - User's last name
	 * @param {string} req.body.email - User's email address (will be converted to lowercase)
	 * @param {string} req.body.password - User's password
	 * @param {string} [req.body.inviteToken] - Invite token for registration (required if superadmin exists)
	 * @param {string} [req.body.teamId] - Team ID (auto-assigned if superadmin)
	 * @param {Array<string>} [req.body.role] - User roles (auto-assigned if superadmin)
	 * @param {Object} [req.file] - Profile image file uploaded via multer
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with user data and JWT token
	 * @throws {Error} 422 - Validation error if request body is invalid
	 * @throws {Error} 409 - Conflict if user already exists
	 * @example
	 * // Register first user (becomes superadmin)
	 * POST /auth/register
	 * {
	 *   "firstName": "John",
	 *   "lastName": "Doe",
	 *   "email": "john@example.com",
	 *   "password": "SecurePass123!"
	 * }
	 *
	 * // Register subsequent user (requires invite token)
	 * POST /auth/register
	 * {
	 *   "firstName": "Jane",
	 *   "lastName": "Smith",
	 *   "email": "jane@example.com",
	 *   "password": "SecurePass123!",
	 *   "inviteToken": "abc123..."
	 * }
	 */
	registerUser = this.asyncHandler(
		async (req, res) => {
			if (req.body?.email) {
				req.body.email = req.body.email?.toLowerCase();
			}
			await registrationBodyValidation.validateAsync(req.body);
			const { user, token } = await this.userService.registerUser(req.body, req.file);
			res.success({
				msg: this.stringService.authCreateUser,
				data: { user, token },
			});
		},
		SERVICE_NAME,
		"registerUser"
	);

	/**
	 * Authenticates a user and returns a JWT token.
	 *
	 * @async
	 * @function loginUser
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing login credentials
	 * @param {string} req.body.email - User's email address (will be converted to lowercase)
	 * @param {string} req.body.password - User's password
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with user data and JWT token
	 * @throws {Error} 422 - Validation error if request body is invalid
	 * @throws {Error} 401 - Unauthorized if credentials are incorrect
	 * @example
	 * POST /auth/login
	 * {
	 *   "email": "john@example.com",
	 *   "password": "SecurePass123!"
	 * }
	 */
	loginUser = this.asyncHandler(
		async (req, res) => {
			if (req.body?.email) {
				req.body.email = req.body.email?.toLowerCase();
			}
			await loginValidation.validateAsync(req.body);
			const { user, token } = await this.userService.loginUser(req.body.email, req.body.password);

			return res.success({
				msg: this.stringService.authLoginUser,
				data: {
					user,
					token,
				},
			});
		},
		SERVICE_NAME,
		"loginUser"
	);

	/**
	 * Updates the current user's profile information.
	 *
	 * @async
	 * @function editUser
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing user update data
	 * @param {string} [req.body.firstName] - Updated first name
	 * @param {string} [req.body.lastName] - Updated last name
	 * @param {string} [req.body.password] - Current password (required for password change)
	 * @param {string} [req.body.newPassword] - New password (required for password change)
	 * @param {boolean} [req.body.deleteProfileImage] - Flag to delete profile image
	 * @param {Object} [req.file] - New profile image file
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with updated user data
	 * @throws {Error} 422 - Validation error if request body is invalid
	 * @throws {Error} 403 - Forbidden if current password is incorrect
	 * @example
	 * PUT /auth/user
	 * {
	 *   "firstName": "John Updated",
	 *   "lastName": "Doe Updated"
	 * }
	 *
	 * // Change password
	 * PUT /auth/user
	 * {
	 *   "password": "OldPass123!",
	 *   "newPassword": "NewPass123!"
	 * }
	 */
	editUser = this.asyncHandler(
		async (req, res) => {
			await editUserBodyValidation.validateAsync(req.body);

			const updatedUser = await this.userService.editUser(req.body, req.file, req.user);

			res.success({
				msg: this.stringService.authUpdateUser,
				data: updatedUser,
			});
		},
		SERVICE_NAME,
		"editUser"
	);

	/**
	 * Checks if a superadmin account exists in the system.
	 *
	 * @async
	 * @function checkSuperadminExists
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with boolean indicating superadmin existence
	 * @example
	 * GET /auth/users/superadmin
	 * // Response: { "data": true } or { "data": false }
	 */
	checkSuperadminExists = this.asyncHandler(
		async (req, res) => {
			const superAdminExists = await this.userService.checkSuperadminExists();
			return res.success({
				msg: this.stringService.authAdminExists,
				data: superAdminExists,
			});
		},
		SERVICE_NAME,
		"checkSuperadminExists"
	);

	/**
	 * Initiates password recovery process by sending a recovery email.
	 *
	 * @async
	 * @function requestRecovery
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing email
	 * @param {string} req.body.email - Email address for password recovery
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with message ID
	 * @throws {Error} 422 - Validation error if email is invalid
	 * @throws {Error} 404 - Not found if user doesn't exist
	 * @example
	 * POST /auth/recovery/request
	 * {
	 *   "email": "john@example.com"
	 * }
	 */
	requestRecovery = this.asyncHandler(
		async (req, res) => {
			await recoveryValidation.validateAsync(req.body);
			const email = req?.body?.email;
			const msgId = await this.userService.requestRecovery(email);
			return res.success({
				msg: this.stringService.authCreateRecoveryToken,
				data: msgId,
			});
		},
		SERVICE_NAME,
		"requestRecovery"
	);

	/**
	 * Validates a password recovery token.
	 *
	 * @async
	 * @function validateRecovery
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing recovery token
	 * @param {string} req.body.recoveryToken - Recovery token to validate
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response if token is valid
	 * @throws {Error} 422 - Validation error if token format is invalid
	 * @throws {Error} 400 - Bad request if token is invalid or expired
	 * @example
	 * POST /auth/recovery/validate
	 * {
	 *   "recoveryToken": "abc123..."
	 * }
	 */
	validateRecovery = this.asyncHandler(
		async (req, res) => {
			await recoveryTokenBodyValidation.validateAsync(req.body);
			await this.userService.validateRecovery(req.body.recoveryToken);
			return res.success({
				msg: this.stringService.authVerifyRecoveryToken,
			});
		},
		SERVICE_NAME,
		"validateRecovery"
	);

	/**
	 * Resets user password using a valid recovery token.
	 *
	 * @async
	 * @function resetPassword
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing new password and recovery token
	 * @param {string} req.body.password - New password
	 * @param {string} req.body.recoveryToken - Valid recovery token
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with user data and JWT token
	 * @throws {Error} 422 - Validation error if password format is invalid
	 * @throws {Error} 400 - Bad request if token is invalid or expired
	 * @example
	 * POST /auth/recovery/reset
	 * {
	 *   "password": "NewSecurePass123!",
	 *   "recoveryToken": "abc123..."
	 * }
	 */
	resetPassword = this.asyncHandler(
		async (req, res) => {
			await newPasswordValidation.validateAsync(req.body);
			const { user, token } = await this.userService.resetPassword(req.body.password, req.body.recoveryToken);
			return res.success({
				msg: this.stringService.authResetPassword,
				data: { user, token },
			});
		},
		SERVICE_NAME,
		"resetPassword"
	);

	/**
	 * Deletes the current user's account and associated data.
	 *
	 * @async
	 * @function deleteUser
	 * @param {Object} req - Express request object
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user._id - User ID
	 * @param {string} req.user.email - User email
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Array<string>} req.user.role - User roles
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response confirming user deletion
	 * @throws {Error} 400 - Bad request if user is demo user
	 * @throws {Error} 404 - Not found if user doesn't exist
	 * @example
	 * DELETE /auth/user
	 * // Requires JWT authentication
	 */
	deleteUser = this.asyncHandler(
		async (req, res) => {
			await this.userService.deleteUser(req.user);
			return res.success({
				msg: this.stringService.authDeleteUser,
			});
		},
		SERVICE_NAME,
		"deleteUser"
	);

	/**
	 * Retrieves all users in the system (admin/superadmin only).
	 *
	 * @async
	 * @function getAllUsers
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with array of users
	 * @throws {Error} 403 - Forbidden if user doesn't have admin/superadmin role
	 * @example
	 * GET /auth/users
	 * // Requires JWT authentication with admin/superadmin role
	 */
	getAllUsers = this.asyncHandler(
		async (req, res) => {
			const allUsers = await this.userService.getAllUsers();
			return res.success({
				msg: this.stringService.authGetAllUsers,
				data: allUsers,
			});
		},
		SERVICE_NAME,
		"getAllUsers"
	);

	/**
	 * Retrieves a specific user by ID (superadmin only).
	 *
	 * @async
	 * @function getUserById
	 * @param {Object} req - Express request object
	 * @param {Object} req.params - URL parameters
	 * @param {string} req.params.userId - ID of the user to retrieve
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {Array<string>} req.user.role - Current user's roles
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with user data
	 * @throws {Error} 422 - Validation error if userId is invalid
	 * @throws {Error} 403 - Forbidden if user doesn't have superadmin role
	 * @throws {Error} 404 - Not found if user doesn't exist
	 * @example
	 * GET /auth/users/507f1f77bcf86cd799439011
	 * // Requires JWT authentication with superadmin role
	 */
	getUserById = this.asyncHandler(
		async (req, res) => {
			await getUserByIdParamValidation.validateAsync(req.params);
			const userId = req?.params?.userId;
			const roles = req?.user?.role;

			if (!userId) {
				throw new Error("No user ID in request");
			}

			if (!roles || roles.length === 0) {
				throw new Error("No roles in request");
			}

			const user = await this.userService.getUserById(roles, userId);

			return res.success({ msg: "ok", data: user });
		},
		SERVICE_NAME,
		"getUserById"
	);

	/**
	 * Updates a specific user by ID (superadmin only).
	 *
	 * @async
	 * @function editUserById
	 * @param {Object} req - Express request object
	 * @param {Object} req.params - URL parameters
	 * @param {string} req.params.userId - ID of the user to update
	 * @param {Object} req.body - Request body containing user update data
	 * @param {string} [req.body.firstName] - Updated first name
	 * @param {string} [req.body.lastName] - Updated last name
	 * @param {Array<string>} [req.body.role] - Updated user roles
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user._id - Current user's ID
	 * @param {Array<string>} req.user.role - Current user's roles
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response confirming user update
	 * @throws {Error} 422 - Validation error if parameters or body are invalid
	 * @throws {Error} 403 - Forbidden if user doesn't have superadmin role
	 * @throws {Error} 404 - Not found if user doesn't exist
	 * @example
	 * PUT /auth/users/507f1f77bcf86cd799439011
	 * {
	 *   "firstName": "Updated Name",
	 *   "role": ["admin"]
	 * }
	 * // Requires JWT authentication with superadmin role
	 */
	editUserById = this.asyncHandler(
		async (req, res) => {
			const roles = req?.user?.role;
			if (!roles.includes("superadmin")) {
				throw createError("Unauthorized", 403);
			}

			const userId = req.params.userId;
			const user = { ...req.body };

			await editUserByIdParamValidation.validateAsync(req.params);
			// If this is superadmin self edit, allow "superadmin" role
			if (userId === req.user._id) {
				await editSuperadminUserByIdBodyValidation.validateAsync(req.body);
			} else {
				await editUserByIdBodyValidation.validateAsync(req.body);
			}

			await this.userService.editUserById(userId, user);
			return res.success({ msg: "ok" });
		},
		SERVICE_NAME,
		"editUserById"
	);
}

export default AuthController;
