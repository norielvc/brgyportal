export function mergeKapchatMessages(existing, incoming) {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return existing || [];
  }
  const map = new Map((existing || []).map((m) => [m.id, m]));
  for (const msg of incoming) {
    if (msg?.id) map.set(msg.id, msg);
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );
}

export function latestKapchatCreatedAt(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  let max = null;
  for (const m of messages) {
    if (!m?.created_at) continue;
    const iso = new Date(m.created_at).toISOString();
    if (!max || iso > max) max = iso;
  }
  return max;
}

/**
 * KapChat portal thread: only messages for this verified resident.
 * Admin replies appear only after that resident has sent at least one message
 * (with matching resident_id), not every old reply on the same phone number.
 */
export function filterKapchatMessagesForResident(
  messages,
  residentId,
  residentName = "",
) {
  if (!Array.isArray(messages) || !residentId) return [];

  const rid = String(residentId);
  const nameKey = (residentName || "").trim().toLowerCase();
  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );

  const isCitizenForResident = (m) => {
    if (m.is_admin) return false;
    if (m.resident_id != null && String(m.resident_id) !== "") {
      return String(m.resident_id) === rid;
    }
    return (
      nameKey &&
      (m.sender_name || "").trim().toLowerCase() === nameKey
    );
  };

  const citizenForResident = sorted.filter(isCitizenForResident);

  if (citizenForResident.length === 0) {
    return [];
  }

  const threadStart = new Date(citizenForResident[0].created_at).getTime();

  return sorted.filter((m) => {
    if (!m.is_admin) {
      return isCitizenForResident(m);
    }
    return new Date(m.created_at).getTime() >= threadStart;
  });
}

/** Legacy threads (no resident_id): one conversation per contact + sender name. */
export function filterLegacyKapchatThread(messages, contact, senderName) {
  if (!Array.isArray(messages)) return [];
  const c = (contact || "").trim();
  const nameKey = (senderName || "").trim().toLowerCase();
  if (!c || !nameKey) return [];

  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );

  const citizens = sorted.filter(
    (m) =>
      !m.is_admin &&
      (m.contact || "").trim() === c &&
      (m.sender_name || "").trim().toLowerCase() === nameKey,
  );
  if (citizens.length === 0) return [];

  const threadStart = new Date(citizens[0].created_at).getTime();

  return sorted.filter((m) => {
    if ((m.contact || "").trim() !== c) return false;
    if (!m.is_admin) {
      return (m.sender_name || "").trim().toLowerCase() === nameKey;
    }
    return new Date(m.created_at).getTime() >= threadStart;
  });
}

/**
 * Help Desk: one inbox row per verified resident (not one row per phone number).
 */
export function buildKapchatHelpDeskThreads(allMessages) {
  if (!Array.isArray(allMessages)) return [];

  const citizens = allMessages.filter((m) => !m.is_admin);
  const seen = new Map();

  for (const msg of citizens) {
    const rid =
      msg.resident_id != null && String(msg.resident_id).trim() !== ""
        ? String(msg.resident_id)
        : null;
    const contact = (msg.contact || "").trim();
    const sender_name = (msg.sender_name || "Resident").trim();

    let threadKey;
    let residentId = null;
    if (rid) {
      threadKey = `resident:${rid}`;
      residentId = rid;
    } else {
      threadKey = `legacy:${contact}::${sender_name.toLowerCase()}`;
    }

    if (!seen.has(threadKey)) {
      seen.set(threadKey, {
        threadKey,
        residentId,
        contact,
        sender_name,
      });
    }
  }

  const threads = [...seen.values()]
    .map((meta) => {
      const messages = meta.residentId
        ? filterKapchatMessagesForResident(
            allMessages,
            meta.residentId,
            meta.sender_name,
          )
        : filterLegacyKapchatThread(
            allMessages,
            meta.contact,
            meta.sender_name,
          );

      const sortedMsgs = [...messages].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
      const lastMsg = sortedMsgs[sortedMsgs.length - 1];
      const unreadCount = sortedMsgs.filter(
        (m) => !m.is_admin && m.status === "unread",
      ).length;
      const hasUnread = unreadCount > 0;
      const allReplied = sortedMsgs.some((m) => m.is_admin);

      return {
        threadKey: meta.threadKey,
        residentId: meta.residentId,
        contact: meta.contact,
        sender_name: meta.sender_name,
        messages: sortedMsgs,
        lastMessage: lastMsg?.message || "",
        lastMessageTime: lastMsg?.created_at || null,
        unreadCount,
        status: hasUnread ? "unread" : allReplied ? "replied" : "read",
      };
    })
    .filter((t) => t.messages.length > 0);

  return threads.sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime),
  );
}
