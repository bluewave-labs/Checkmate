
class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
        this.triggerNotification = this.triggerNotification.bind(this);
    }

    async triggerNotification(req, res, next) { 
        try {
            const { monitorId, type, config } = req.body;
    
            const networkResponse = {
                monitor: { _id: monitorId, name: "Test Monitor", url: "http://www.google.com" },
                status: false,
                statusChanged: true,
                prevStatus: true,
            };

            if (type === "webhook") {
                await this.notificationService.sendWebhookNotification(
                    networkResponse,
                    config
                );
            }

            return res.success({
                msg: "Notification sent successfully"
            });

        } catch (error) {
            error.service = "NotificationController";
            error.method = "triggerNotification";
            next(error);
        }
    }
}

export default NotificationController;