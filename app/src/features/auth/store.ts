type Credentials = { username: string; password: string };
type Profile = {
  fullName: string;
  email: string;
  age: string;
  major: string;
  university?: string;
  country?: string;
  photo?: string;
};
type User = { username: string; profile: Profile };

const LS_USER = 'cr_user_v2';
const LS_PROFILE = 'cr_profile_v2';

export function isAuthenticated(): boolean {
  try { return !!localStorage.getItem(LS_USER); } catch { return false; }
}
export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(LS_USER);
    if (!raw) return null;
    const u = JSON.parse(raw) as User;
    return u;
  } catch { return null; }
}
export function getUserPublic(): { id: string; email: string } | null {
  const u = getUser();
  if (!u) return null;
  return { id: u.username, email: u.profile?.email || '' };
}
export function getProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
export function setProfile(data: Profile) {
  localStorage.setItem(LS_PROFILE, JSON.stringify(data));
  const user = getUser();
  if (user) {
    user.profile = data;
    localStorage.setItem(LS_USER, JSON.stringify(user));
  }
}
export function updateProfile(patch: Partial<Profile>) {
  const cur = getProfile() || ({} as Profile);
  const next = { ...cur, ...patch } as Profile;
  setProfile(next);
}
export async function login(creds: Credentials) {
  // mock: any username/password accepted if length>0
  if (!creds.username || !creds.password) throw new Error('Enter username and password');
  const existingProfile = getProfile() || {
    fullName: creds.username,
    email: `${creds.username}@example.com`,
    age: '20',
    major: 'Cybersecurity'
  };
  const user: User = { username: creds.username, profile: existingProfile };
  localStorage.setItem(LS_USER, JSON.stringify(user));
  localStorage.setItem(LS_PROFILE, JSON.stringify(existingProfile));
}
export async function signup(data: { username: string; password: string } & Profile) {
  if (!data.username || !data.password) throw new Error('Enter username and password');
  const profile: Profile = {
    fullName: data.fullName,
    email: data.email,
    age: data.age,
    major: data.major,
    university: data.university,
    country: data.country
  };
  const user: User = { username: data.username, profile };
  localStorage.setItem(LS_USER, JSON.stringify(user));
  localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
}
export function logout() {
  localStorage.removeItem(LS_USER);
  // Keep profile if you want; spec allows fallback store so we keep it for Info menu visibility
}


