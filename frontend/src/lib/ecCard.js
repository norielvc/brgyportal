/** Stored in DB for NOT NULL expiry_date; EC cards do not expire in the portal. */
export const EC_CARD_NO_EXPIRY_DATE = "2099-12-31";

export function isEcCardExpired() {
  return false;
}
