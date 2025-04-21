import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";

class NotificationRoutes {
    constructor(notificationController) {
        this.router = Router();
        this.notificationController = notificationController;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.use(verifyJWT);
        
        this.router.post(
            "/trigger",
            this.notificationController.triggerNotification
        );
        
        this.router.post(
            "/test-webhook",
            this.notificationController.testWebhook
        );
    }

    getRouter() {
        return this.router;
    }
}

export default NotificationRoutes;