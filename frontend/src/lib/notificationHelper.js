/**
 * Helper function to create in-app notifications
 * This works alongside email notifications
 */

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
