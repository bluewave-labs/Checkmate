import sinon from "sinon";
import EmailService from "../../service/emailService.js";

describe("EmailService - Constructor", function () {
	let settingsServiceMock;
	let fsMock;
	let pathMock;
	let compileMock;
	let mjml2htmlMock;
	let nodemailerMock;
	let loggerMock;

	beforeEach(function () {
		settingsServiceMock = {
			getSettings: sinon.stub().returns({
				systemEmailHost: "smtp.example.com",
				systemEmailPort: 465,
				systemEmailAddress: "test@example.com",
				systemEmailPassword: "password",
			}),
		};

		fsMock = {
			readFileSync: sinon.stub().returns("<mjml><body></body></mjml>"),
		};

		pathMock = {
			join: sinon.stub().callsFake((...args) => args.join("/")),
		};

		compileMock = sinon.stub().returns(() => "<mjml><body></body></mjml>");

		mjml2htmlMock = sinon.stub().returns({ html: "<html></html>" });

		nodemailerMock = {
			createTransport: sinon.stub().returns({
				sendMail: sinon.stub().resolves({ messageId: "12345" }),
			}),
		};

		loggerMock = {
			error: sinon.stub(),
		};
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should initialize template loaders and email transporter", function () {
		const emailService = new EmailService(
			settingsServiceMock,
			fsMock,
			pathMock,
			compileMock,
			mjml2htmlMock,
			nodemailerMock,
			loggerMock
		);

		// Verify that the settingsService is assigned correctly
		expect(emailService.settingsService).to.equal(settingsServiceMock);

		// Verify that the template loaders are initialized
		expect(emailService.templateLookup.welcomeEmailTemplate).to.be.a("function");
		expect(emailService.templateLookup.employeeActivationTemplate).to.be.a("function");

		// Verify that the email transporter is initialized
		expect(nodemailerMock.createTransport.calledOnce).to.be.true;
		const emailConfig = nodemailerMock.createTransport.getCall(0).args[0];
		expect(emailConfig).to.deep.equal({
			host: "smtp.example.com",
			port: 465,
			secure: true,
			auth: {
				user: "test@example.com",
				pass: "password",
			},
		});
	});

	it("should have undefined templates if FS fails", function () {
		fsMock = {
			readFileSync: sinon.stub().throws(new Error("File read error")),
		};
		const emailService = new EmailService(
			settingsServiceMock,
			fsMock,
			pathMock,
			compileMock,
			mjml2htmlMock,
			nodemailerMock,
			loggerMock
		);
		expect(loggerMock.error.called).to.be.true;
		expect(loggerMock.error.firstCall.args[0].message).to.equal("File read error");
	});
});

describe("EmailService - buildAndSendEmail", function () {
	let settingsServiceMock;
	let fsMock;
	let pathMock;
	let compileMock;
	let mjml2htmlMock;
	let nodemailerMock;
	let loggerMock;
	let emailService;

	beforeEach(function () {
		settingsServiceMock = {
			getSettings: sinon.stub().returns({
				systemEmailHost: "smtp.example.com",
				systemEmailPort: 465,
				systemEmailAddress: "test@example.com",
				systemEmailPassword: "password",
			}),
		};

		fsMock = {
			readFileSync: sinon.stub().returns("<mjml><body></body></mjml>"),
		};

		pathMock = {
			join: sinon.stub().callsFake((...args) => args.join("/")),
		};

		compileMock = sinon.stub().returns(() => "<mjml><body></body></mjml>");

		mjml2htmlMock = sinon.stub().returns({ html: "<html></html>" });

		nodemailerMock = {
			createTransport: sinon.stub().returns({
				sendMail: sinon.stub().resolves({ messageId: "12345" }),
			}),
		};

		loggerMock = {
			error: sinon.stub(),
		};

		emailService = new EmailService(
			settingsServiceMock,
			fsMock,
			pathMock,
			compileMock,
			mjml2htmlMock,
			nodemailerMock,
			loggerMock
		);
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should build and send email successfully", async function () {
		const messageId = await emailService.buildAndSendEmail(
			"welcomeEmailTemplate",
			{},
			"recipient@example.com",
			"Welcome"
		);

		expect(messageId).to.equal("12345");
		expect(nodemailerMock.createTransport().sendMail.calledOnce).to.be.true;
	});

	it("should log error if building HTML fails", async function () {
		mjml2htmlMock.throws(new Error("MJML error"));

		const messageId = await emailService.buildAndSendEmail(
			"welcomeEmailTemplate",
			{},
			"recipient@example.com",
			"Welcome"
		);
		expect(loggerMock.error.calledOnce).to.be.true;
		expect(loggerMock.error.getCall(0).args[0].message).to.equal("MJML error");
	});

	it("should log error if sending email fails", async function () {
		nodemailerMock.createTransport().sendMail.rejects(new Error("SMTP error"));
		await emailService.buildAndSendEmail(
			"welcomeEmailTemplate",
			{},
			"recipient@example.com",
			"Welcome"
		);
		expect(loggerMock.error.calledOnce).to.be.true;
		expect(loggerMock.error.getCall(0).args[0].message).to.equal("SMTP error");
	});

	it("should log error if both building HTML and sending email fail", async function () {
		mjml2htmlMock.throws(new Error("MJML error"));
		nodemailerMock.createTransport().sendMail.rejects(new Error("SMTP error"));

		const messageId = await emailService.buildAndSendEmail(
			"welcomeEmailTemplate",
			{},
			"recipient@example.com",
			"Welcome"
		);

		expect(messageId).to.be.undefined;
		expect(loggerMock.error.calledTwice).to.be.true;
		expect(loggerMock.error.getCall(0).args[0].message).to.equal("MJML error");
		expect(loggerMock.error.getCall(1).args[0].message).to.equal("SMTP error");
	});

	it("should log an error if buildHtml fails", async function () {});
});
