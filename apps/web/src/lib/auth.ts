export type StoredUser = {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
};

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("second_brain_token");
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("second_brain_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isSignedIn() {
  return Boolean(getStoredToken());
}

export function logout() {
  localStorage.removeItem("second_brain_token");
  localStorage.removeItem("second_brain_user");
  window.location.href = "/login";
}
