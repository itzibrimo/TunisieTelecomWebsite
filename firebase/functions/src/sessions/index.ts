/**
 * =============================================================================
 * SESSION CLEANUP FUNCTION
 * =============================================================================
 *
 * Scheduled Cloud Function that automatically removes expired sessions.
 * Runs daily at 4:00 AM Tunisia time.
 * Deletes sessions older than 30 days for all users.
 *
 * This supplements the client-side cleanup in the devices page.
 * =============================================================================
 */

import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

const db = admin.firestore();

const DEFAULT_SESSION_AGE_DAYS = 30;
const BATCH_SIZE = 500;

// =============================================================================
// Scheduled cleanup of expired sessions (runs daily)
// =============================================================================

export const cleanupExpiredSessions = onSchedule(
  {
    schedule: "0 4 * * *", // Every day at 4:00 AM Tunisia time
    timeZone: "Africa/Tunis",
    region: "europe-west1",
  },
  async () => {
    try {
      logger.info("Starting expired session cleanup");

      // Get all users with sessions
      const usersSnapshot = await db.collection("users").get();
      let totalDeleted = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const maxAgeDays = userData.sessionExpiryDays || DEFAULT_SESSION_AGE_DAYS;
        const sessionsRef = db.collection(`users/${userId}/sessions`);

        // Find expired sessions for this user using their configured expiry
        const userCutoffDate = new Date();
        userCutoffDate.setDate(userCutoffDate.getDate() - maxAgeDays);
        const userCutoffTimestamp = admin.firestore.Timestamp.fromDate(userCutoffDate);

        const expiredSnapshot = await sessionsRef
          .where("createdAt", "<", userCutoffTimestamp)
          .limit(BATCH_SIZE)
          .get();

        if (expiredSnapshot.empty) continue;

        // Delete in batches
        const batch = db.batch();
        expiredSnapshot.docs.forEach((sessionDoc: { ref: admin.firestore.DocumentReference }) => {
          batch.delete(sessionDoc.ref);
        });

        await batch.commit();
        totalDeleted += expiredSnapshot.size;

        logger.info(`Deleted ${expiredSnapshot.size} expired session(s) for user ${userId}`);
      }

      logger.info(`Session cleanup complete: ${totalDeleted} total expired session(s) removed`);

      // Log cleanup stats to analytics collection for dashboard
      await db.collection("analytics").doc("sessionCleanup").collection("daily").add({
        date: admin.firestore.Timestamp.now(),
        totalDeleted,
        usersScanned: usersSnapshot.size,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error("Error during session cleanup:", error);
    }
  }
);
