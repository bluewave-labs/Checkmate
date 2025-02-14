import express from 'express';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { triggerNotificationBodyValidation } from '../validation/joi.js';

class NotificationRoutes {
    constructor(notificationController) {
        this.notificationController = notificationController;
        this.router = express.Router();
        this.initializeRoutes();
    }

    validateRequest(schema) {
        return (req, res, next) => {
            const { error } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const errorMessage = error.details
                    .map(detail => detail.message)
                    .join(', ');
                    
                return res.status(400).json({
                    success: false,
                    msg: errorMessage
                });
            }

            next();
        };
    }

    initializeRoutes() {
        this.router.post(
            '/trigger', 
            verifyJWT,
            this.validateRequest(triggerNotificationBodyValidation),
            this.notificationController.triggerNotification
        );
    }

    getRouter() {
        return this.router;
    }
}

export default NotificationRoutes;