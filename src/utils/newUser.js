const NEW_USER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// True for the first 7 days after the account's registration timestamp.
export function isNewUser(createdAt) {
  if (!createdAt) {
    return false;
  }
  const createdAtMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return false;
  }
  return Date.now() - createdAtMs < NEW_USER_WINDOW_MS;
}
