export type SendPushNotificationPayload = {
  fcmToken: string;
  title: string;
  body: string;
};

export type SendPushNotificationResponse = {
  success?: boolean;
  error?: string;
};

export type ScheduleReminderPayload = {
  fcmToken: string;
  sendAtTimestamp: number;
  title: string;
  body: string;
};

export type ScheduleReminderResponse = {
  success?: boolean;
  taskId?: string;
  error?: string;
};


export interface FcmCloudService {
  sendPushNotification(
    projectId: string,
    payload: SendPushNotificationPayload,
    useLocalEmulator?: boolean
  ): Promise<SendPushNotificationResponse>;

  scheduleReminder(
    projectId: string,
    payload: ScheduleReminderPayload,
    useLocalEmulator?: boolean
  ): Promise<ScheduleReminderResponse>;

  cancelReminder(
    projectId: string,
    taskId: string,
    useLocalEmulator?: boolean
  ): Promise<{ success?: boolean; error?: string }>;
}

const getBaseUrl = (projectId: string, useLocalEmulator: boolean = true): string => {
  if (useLocalEmulator) {
    // Port 5001 is where the Firebase emulator serves functions
    return `http://127.0.0.1:5001/${projectId}/europe-west1`;
  }
  return `https://europe-west1-${projectId}.cloudfunctions.net`;
};

export const fcmCloudService: FcmCloudService = {
  async sendPushNotification(projectId, payload, useLocalEmulator) {
    const url = `${getBaseUrl(projectId, useLocalEmulator)}/sendPushNotification`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async scheduleReminder(projectId, payload, useLocalEmulator) {
    const url = `${getBaseUrl(projectId, useLocalEmulator)}/scheduleReminder`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async cancelReminder(projectId, taskId, useLocalEmulator) {
    const url = `${getBaseUrl(projectId, useLocalEmulator)}/cancelReminder`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
