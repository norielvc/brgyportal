/**
 * Helper function to create in-app notifications
 * This works alongside email notifications
 */

const CERTIFICATE_NOTIFICATION_CATEGORIES = new Set([
  "assignment",
  "workflow",
  "request_submitted",
  "request_ready",
  "request_rejected",
  "request_returned",
  "certificate",
]);

/** Admin portal: open Certificate Requests (`/requests`), not public `/requests/[id]` tracking. */
export function resolveNotificationNavigationLink(notification) {
  const rawLink = String(notification?.link || "").trim();
  const requestIdFromRow = notification?.request_id
    ? String(notification.request_id).trim()
    : "";
  const requestIdFromPath = rawLink.match(
    /^\/requests\/([0-9a-f-]{36})$/i,
  )?.[1];
  const requestId = requestIdFromRow || requestIdFromPath || "";

  const isCertificateRelated =
    CERTIFICATE_NOTIFICATION_CATEGORIES.has(notification?.category) ||
    Boolean(requestId) ||
    rawLink === "/requests" ||
    rawLink.startsWith("/requests?") ||
    /^\/requests\/[0-9a-f-]{36}$/i.test(rawLink) ||
    /^\/track\//i.test(rawLink);

  if (isCertificateRelated) {
    return requestId
      ? `/requests?id=${encodeURIComponent(requestId)}`
      : "/requests";
  }

  return rawLink || "/requests";
}

export function certificateRequestAdminLink(requestId) {
  if (!requestId) return "/requests";
  return `/requests?id=${encodeURIComponent(String(requestId).trim())}`;
}

export const createNotification = async ({
  userId,
  tenantId,
  title,
  message,
  type = 'info',
  category,
  referenceNumber = null,
  requestId = null,
  link = null
}) => {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        targetUserId: userId,
        title,
        message,
        type,
        category,
        referenceNumber,
        requestId,
        link
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log(`🔔 Notification created for user ${userId}`);
    } else {
      console.warn(`⚠️ Notification failed:`, result.message);
    }
    return result;
  } catch (error) {
    console.error('❌ Notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create notifications for multiple users
 */
export const createNotifications = async (notifications) => {
  const results = [];
  for (const notification of notifications) {
    const result = await createNotification(notification);
    results.push(result);
  }
  return results;
};

/**
 * Notification templates matching email events
 */
export const notificationTemplates = {
  RECEIVED: {
    title: 'Request Received',
    message: (refNumber) => `Your request ${refNumber} has been received and is being processed.`,
    type: 'success',
    category: 'request_submitted'
  },
  SUBMITTED: {
    title: 'New Request Assigned',
    message: (refNumber, applicantName) => `New request ${refNumber} from ${applicantName} needs your review.`,
    type: 'info',
    category: 'assignment'
  },
  APPROVED_STEP: {
    title: 'Request Waiting for You',
    message: (refNumber, applicantName) => `Request ${refNumber} from ${applicantName} requires your approval.`,
    type: 'info',
    category: 'assignment'
  },
  READY_FOR_PICKUP: {
    title: 'Certificate Ready!',
    message: (refNumber) => `Your certificate ${refNumber} is ready for pickup at the Barangay Hall.`,
    type: 'success',
    category: 'request_ready'
  },
  REJECTED: {
    title: 'Request Rejected',
    message: (refNumber, comments) => `Your request ${refNumber} has been rejected. ${comments ? `Reason: ${comments}` : ''}`,
    type: 'error',
    category: 'request_rejected'
  },
  RETURNED: {
    title: 'Corrections Needed',
    message: (refNumber, comments) => `Your request ${refNumber} needs corrections. ${comments ? `Comments: ${comments}` : ''}`,
    type: 'warning',
    category: 'request_returned'
  },
  RESUBMITTED: {
    title: 'Request Resubmitted',
    message: (refNumber, applicantName) => `Request ${refNumber} from ${applicantName} has been resubmitted for your review.`,
    type: 'info',
    category: 'assignment'
  }
};
