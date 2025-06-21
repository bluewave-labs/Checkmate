class StringService {
	static SERVICE_NAME = "StringService";

	constructor(translationService) {
		if (StringService.instance) {
			return StringService.instance;
		}

		this.translationService = translationService;
		this._language = "en"; // default language
		StringService.instance = this;
	}

	setLanguage(language) {
		this._language = language;
	}

	get language() {
		return this._language;
	}

	// Auth Messages
	get dontHaveAccount() {
		return this.translationService.getTranslation("dontHaveAccount");
	}

	get email() {
		return this.translationService.getTranslation("email");
	}

	get forgotPassword() {
		return this.translationService.getTranslation("forgotPassword");
	}

	get password() {
		return this.translationService.getTranslation("password");
	}

	get signUp() {
		return this.translationService.getTranslation("signUp");
	}

	get submit() {
		return this.translationService.getTranslation("submit");
	}

	get title() {
		return this.translationService.getTranslation("title");
	}

	get continue() {
		return this.translationService.getTranslation("continue");
	}

	get enterEmail() {
		return this.translationService.getTranslation("enterEmail");
	}

	get authLoginTitle() {
		return this.translationService.getTranslation("authLoginTitle");
	}

	get authLoginEnterPassword() {
		return this.translationService.getTranslation("authLoginEnterPassword");
	}

	get commonPassword() {
		return this.translationService.getTranslation("commonPassword");
	}

	get commonBack() {
		return this.translationService.getTranslation("commonBack");
	}

	get authForgotPasswordTitle() {
		return this.translationService.getTranslation("authForgotPasswordTitle");
	}

	get authForgotPasswordResetPassword() {
		return this.translationService.getTranslation("authForgotPasswordResetPassword");
	}

	get createPassword() {
		return this.translationService.getTranslation("createPassword");
	}

	get createAPassword() {
		return this.translationService.getTranslation("createAPassword");
	}

	get authRegisterAlreadyHaveAccount() {
		return this.translationService.getTranslation("authRegisterAlreadyHaveAccount");
	}

	get commonAppName() {
		return this.translationService.getTranslation("commonAppName");
	}

	get authLoginEnterEmail() {
		return this.translationService.getTranslation("authLoginEnterEmail");
	}

	get authRegisterTitle() {
		return this.translationService.getTranslation("authRegisterTitle");
	}

	get monitorGetAll() {
		return this.translationService.getTranslation("monitorGetAll");
	}

	get monitorGetById() {
		return this.translationService.getTranslation("monitorGetById");
	}

	get monitorGetByIdSuccess() {
		return this.translationService.getTranslation("monitorGetByIdSuccess");
	}

	get monitorCreate() {
		return this.translationService.getTranslation("monitorCreate");
	}

	get bulkMonitorsCreate() {
		return this.translationService.getTranslation("bulkMonitorsCreate");
	}

	get monitorEdit() {
		return this.translationService.getTranslation("monitorEdit");
	}

	get monitorDelete() {
		return this.translationService.getTranslation("monitorDelete");
	}

	get monitorPause() {
		return this.translationService.getTranslation("monitorPause");
	}

	get monitorResume() {
		return this.translationService.getTranslation("monitorResume");
	}

	get monitorDemoAdded() {
		return this.translationService.getTranslation("monitorDemoAdded");
	}

	get monitorStatsById() {
		return this.translationService.getTranslation("monitorStatsById");
	}

	get monitorCertificate() {
		return this.translationService.getTranslation("monitorCertificate");
	}

	// Maintenance Window Messages
	get maintenanceWindowCreate() {
		return this.translationService.getTranslation("maintenanceWindowCreate");
	}

	get maintenanceWindowGetById() {
		return this.translationService.getTranslation("maintenanceWindowGetById");
	}

	get maintenanceWindowGetByTeam() {
		return this.translationService.getTranslation("maintenanceWindowGetByTeam");
	}

	get maintenanceWindowDelete() {
		return this.translationService.getTranslation("maintenanceWindowDelete");
	}

	get maintenanceWindowEdit() {
		return this.translationService.getTranslation("maintenanceWindowEdit");
	}

	// Webhook Messages
	get webhookUnsupportedPlatform() {
		return this.translationService.getTranslation("webhookUnsupportedPlatform");
	}

	get webhookSendError() {
		return this.translationService.getTranslation("webhookSendError");
	}

	get webhookSendSuccess() {
		return this.translationService.getTranslation("webhookSendSuccess");
	}

	get telegramRequiresBotTokenAndChatId() {
		return this.translationService.getTranslation("telegramRequiresBotTokenAndChatId");
	}

	get webhookUrlRequired() {
		return this.translationService.getTranslation("webhookUrlRequired");
	}

	get platformRequired() {
		return this.translationService.getTranslation("platformRequired");
	}

	get testNotificationFailed() {
		return this.translationService.getTranslation("testNotificationFailed");
	}

	get monitorUpAlert() {
		return this.translationService.getTranslation("monitorUpAlert");
	}

	get monitorDownAlert() {
		return this.translationService.getTranslation("monitorDownAlert");
	}

	getWebhookUnsupportedPlatform(platform) {
		return this.translationService
			.getTranslation("webhookUnsupportedPlatform")
			.replace("{platform}", platform);
	}

	getWebhookSendError(platform) {
		return this.translationService
			.getTranslation("webhookSendError")
			.replace("{platform}", platform);
	}

	getMonitorStatus(name, status, url) {
		const translationKey = status === true ? "monitorStatusUp" : "monitorStatusDown";
		return this.translationService
			.getTranslation(translationKey)
			.replace("{name}", name)
			.replace("{url}", url);
	}

	// Error Messages
	get unknownError() {
		return this.translationService.getTranslation("unknownError");
	}

	get friendlyError() {
		return this.translationService.getTranslation("friendlyError");
	}

	get authIncorrectPassword() {
		return this.translationService.getTranslation("authIncorrectPassword");
	}

	get unauthorized() {
		return this.translationService.getTranslation("unauthorized");
	}

	get authAdminExists() {
		return this.translationService.getTranslation("authAdminExists");
	}

	get authInviteNotFound() {
		return this.translationService.getTranslation("authInviteNotFound");
	}

	get unknownService() {
		return this.translationService.getTranslation("unknownService");
	}

	get noAuthToken() {
		return this.translationService.getTranslation("noAuthToken");
	}

	get invalidAuthToken() {
		return this.translationService.getTranslation("invalidAuthToken");
	}

	get expiredAuthToken() {
		return this.translationService.getTranslation("expiredAuthToken");
	}

	// Queue Messages
	get queueGetMetrics() {
		return this.translationService.getTranslation("queueGetMetrics");
	}

	get queueGetJobs() {
		return this.translationService.getTranslation("queueGetJobs");
	}

	get queueAddJob() {
		return this.translationService.getTranslation("queueAddJob");
	}

	get queueObliterate() {
		return this.translationService.getTranslation("queueObliterate");
	}

	// Job Queue Messages
	get jobQueueDeleteJobSuccess() {
		return this.translationService.getTranslation("jobQueueDeleteJobSuccess");
	}

	get jobQueuePauseJob() {
		return this.translationService.getTranslation("jobQueuePauseJob");
	}

	get jobQueueResumeJob() {
		return this.translationService.getTranslation("jobQueueResumeJob");
	}

	// Status Page Messages
	get statusPageByUrl() {
		return this.translationService.getTranslation("statusPageByUrl");
	}

	get statusPageCreate() {
		return this.translationService.getTranslation("statusPageCreate");
	}

	get statusPageDelete() {
		return this.translationService.getTranslation("statusPageDelete");
	}

	get statusPageUpdate() {
		return this.translationService.getTranslation("statusPageUpdate");
	}

	get statusPageNotFound() {
		return this.translationService.getTranslation("statusPageNotFound");
	}

	get statusPageByTeamId() {
		return this.translationService.getTranslation("statusPageByTeamId");
	}

	get statusPageUrlNotUnique() {
		return this.translationService.getTranslation("statusPageUrlNotUnique");
	}

	// Docker Messages
	get dockerFail() {
		return this.translationService.getTranslation("dockerFail");
	}

	get dockerNotFound() {
		return this.translationService.getTranslation("dockerNotFound");
	}

	get dockerSuccess() {
		return this.translationService.getTranslation("dockerSuccess");
	}

	// Port Messages
	get portFail() {
		return this.translationService.getTranslation("portFail");
	}

	get portSuccess() {
		return this.translationService.getTranslation("portSuccess");
	}

	// Alert Messages
	get alertCreate() {
		return this.translationService.getTranslation("alertCreate");
	}

	get alertGetByUser() {
		return this.translationService.getTranslation("alertGetByUser");
	}

	get alertGetByMonitor() {
		return this.translationService.getTranslation("alertGetByMonitor");
	}

	get alertGetById() {
		return this.translationService.getTranslation("alertGetById");
	}

	get alertEdit() {
		return this.translationService.getTranslation("alertEdit");
	}

	get alertDelete() {
		return this.translationService.getTranslation("alertDelete");
	}

	getDeletedCount(count) {
		return this.translationService
			.getTranslation("deletedCount")
			.replace("{count}", count);
	}

	get pingSuccess() {
		return this.translationService.getTranslation("pingSuccess");
	}

	get getAppSettings() {
		return this.translationService.getTranslation("getAppSettings");
	}

	get httpNetworkError() {
		return this.translationService.getTranslation("httpNetworkError");
	}

	get httpNotJson() {
		return this.translationService.getTranslation("httpNotJson");
	}

	get httpJsonPathError() {
		return this.translationService.getTranslation("httpJsonPathError");
	}

	get httpEmptyResult() {
		return this.translationService.getTranslation("httpEmptyResult");
	}

	get httpMatchSuccess() {
		return this.translationService.getTranslation("httpMatchSuccess");
	}

	get httpMatchFail() {
		return this.translationService.getTranslation("httpMatchFail");
	}

	get updateAppSettings() {
		return this.translationService.getTranslation("updateAppSettings");
	}

	get insufficientPermissions() {
		return this.translationService.getTranslation("insufficientPermissions");
	}

	getDbFindMonitorById(monitorId) {
		return this.translationService
			.getTranslation("dbFindMonitorById")
			.replace("${monitorId}", monitorId);
	}

	get dbUserExists() {
		return this.translationService.getTranslation("dbUserExists");
	}

	get testEmailSubject() {
		return this.translationService.getTranslation("testEmailSubject");
	}
}

export default StringService;
