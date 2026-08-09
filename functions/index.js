const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const { onTaskDispatched } = require("firebase-functions/v2/tasks");
const admin = require("firebase-admin");
const { getFunctions } = require("firebase-admin/functions");
const crypto = require("crypto");

// Default region/location
setGlobalOptions({ maxInstances: 10, region: "europe-west1" });

admin.initializeApp();

// Endpoint called by the React Web App to schedule a reminder
exports.scheduleReminder = onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).send("");
    }

    const { fcmToken, sendAtTimestamp, title, body } = req.body;
    const taskId = crypto.randomUUID();

    try {
        const queue = getFunctions().taskQueue("locations/europe-west1/functions/fcmRemindersQueue");
        await queue.enqueue({
            fcmToken,
            title,
            body,
            sendAtTimestamp
        }, {
            id: taskId,
            scheduleTime: new Date(sendAtTimestamp)
        });
        res.status(200).send({ success: true, taskId });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Endpoint called by the React Web App to cancel a scheduled reminder
exports.cancelReminder = onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).send("");
    }

    const { taskId } = req.body;
    if (!taskId) {
        return res.status(400).send({ error: "taskId is required" });
    }

    try {
        const queue = getFunctions().taskQueue("locations/europe-west1/functions/fcmRemindersQueue");
        await queue.delete(taskId);
        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Endpoint called by Cloud Tasks when the schedule time is reached
exports.sendPushNotification = onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).send("");
    }

    const { fcmToken, title, body } = req.body;

    try {
        await admin.messaging().send({
            token: fcmToken,
            notification: { title, body },
        });
        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Task queue function to send the scheduled notification
exports.fcmRemindersQueue = onTaskDispatched({
    retryConfig: { maxAttempts: 1 },
}, async (event) => {
    const { fcmToken, title, body, sendAtTimestamp } = event.data;

    // In local emulator environment, simulate the delay if the scheduled time is in the future
    if (process.env.FUNCTIONS_EMULATOR === "true" && sendAtTimestamp) {
        const delayMs = sendAtTimestamp - Date.now();
        if (delayMs > 0) {
            // Cap at 60 seconds to prevent emulator function timeout
            const actualDelayMs = Math.min(delayMs, 60000);
            console.log(`[Emulator] Simulating scheduled task delay of ${actualDelayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, actualDelayMs));
        }
    }

    try {
        await admin.messaging().send({
            token: fcmToken,
            notification: { title, body },
        });
    } catch (error) {
        console.error("Failed to send push notification:", error);
    }
});

