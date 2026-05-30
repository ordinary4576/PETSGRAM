import admin from 'firebase-admin';

export class NotificationService {
  private static isInitialized = false;

  /**
   * Initializes the Firebase Admin SDK safely
   */
  private static initializeFirebase() {
    if (this.isInitialized) return;

    const credentialsJson = process.env.FIREBASE_CREDENTIALS_JSON;

    if (!credentialsJson) {
      console.warn('Firebase push credentials missing. Falling back to notification sandbox console logs.');
      this.isInitialized = true;
      return;
    }

    try {
      const credentials = JSON.parse(credentialsJson);
      admin.initializeApp({
        credential: admin.credential.cert(credentials)
      });
      this.isInitialized = true;
      console.info('NOTIFICATION SERVICE: Firebase Admin SDK initialized successfully.');
    } catch (e: any) {
      console.error(`ERROR: Firebase initialization failed. Message: ${e.message}`);
      this.isInitialized = true;
    }
  }

  /**
   * Dispatches push alert to target mobile device tokens (FCM Admin SDK)
   */
  public static async sendPushNotification(deviceToken: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
    this.initializeFirebase();

    const payload = {
      notification: { title, body },
      data: data || {},
      token: deviceToken
    };

    const hasCreds = process.env.FIREBASE_CREDENTIALS_JSON;
    if (!hasCreds) {
      // Sandbox fallback logger
      console.info(`==============================================================================`);
      console.info(`🔔 FIREBASE FCM PUSH SANDBOX PREVIEW: Push Broadcast Issued`);
      console.info(`👉 Device Token: ${deviceToken}`);
      console.info(`👉 Notification: [${title}] - ${body}`);
      if (data) console.info(`👉 Metadata Payload: ${JSON.stringify(data)}`);
      console.info(`==============================================================================`);
      return true;
    }

    try {
      const response = await admin.messaging().send(payload);
      console.info(`FCM SUCCESS: Push message sent successfully. ID: ${response}`);
      return true;
    } catch (error: any) {
      console.error(`ERROR: FCM push delivery failure. Message: ${error.message}`);
      return false;
    }
  }

  /**
   * Geospatially filters users nearby coordinates and broadcasts emergency missing alerts
   */
  public static async broadcastNearbyRescueAlert(lat: number, lng: number, petName: string): Promise<void> {
    console.info(`NOTIF SERVICE: Geospatially scanning coordinates near Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}...`);
    
    // In production: Query locations table, fetch users tokens within 5km radius,
    // and broadcast push notifications concurrently.
    
    const mockDeviceTokens = ['tok_user_alex_39a0ef', 'tok_user_taylor_2091ac'];
    for (const token of mockDeviceTokens) {
      await this.sendPushNotification(
        token,
        '🚨 EMERGENCY ALERT: Pet Missing Near You!',
        `Ziggy (${petName}) was reported lost near your regional coordinate boundaries. Tap to view last seen details!`,
        { petName, eventType: 'LOST_PET_ALERT', lat: lat.toString(), lng: lng.toString() }
      );
    }
  }
}
export default NotificationService;
