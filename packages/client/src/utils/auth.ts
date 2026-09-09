export interface UserAccount {
  username: string;
  password: string; // Stored locally in browser
  avatar: string; // Faction or character avatar icon
  fullName?: string;
  email?: string;
  createdAt: string;
  lastLogin: string;
}

const STORAGE_USERS_KEY = 'arena_accounts_db';
const STORAGE_CURRENT_USER_KEY = 'arena_active_user';

// Default seeded accounts including Founder Abhay Pandey
const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    username: 'Abhay',
    password: 'password123',
    avatar: 'spiderman',
    fullName: 'Abhay Pandey',
    email: 'abhaypandey0572005@gmail.com',
    createdAt: '2026-08-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    username: 'Champion',
    password: 'password123',
    avatar: 'goku',
    fullName: 'Arena Champion',
    email: 'champion@cardarena.com',
    createdAt: '2026-08-15T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
];

export function getAccounts(): Record<string, UserAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      const initial: Record<string, UserAccount> = {};
      for (const acc of DEFAULT_ACCOUNTS) {
        initial[acc.username.toLowerCase()] = acc;
      }
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveAccount(account: UserAccount): void {
  const accounts = getAccounts();
  accounts[account.username.toLowerCase()] = account;
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(accounts));
}

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserAccount | null): void {
  if (!user) {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  } else {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  }
}

export function loginUser(username: string, password: string): { success: boolean; error?: string; user?: UserAccount } {
  const cleanUser = username.trim();
  if (!cleanUser) {
    return { success: false, error: 'Please enter a username.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  const accounts = getAccounts();
  const account = accounts[cleanUser.toLowerCase()];

  if (!account) {
    return { success: false, error: 'Username not found. Check your spelling or create a new account!' };
  }

  if (account.password !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  // Update last login
  account.lastLogin = new Date().toISOString();
  saveAccount(account);
  setCurrentUser(account);

  return { success: true, user: account };
}

export function registerUser(
  username: string, 
  password: string, 
  avatar: string = 'ironman',
  fullName?: string,
  email?: string
): { success: boolean; error?: string; user?: UserAccount } {
  const cleanUser = username.trim();
  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }
  if (!password || password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  const accounts = getAccounts();
  if (accounts[cleanUser.toLowerCase()]) {
    return { success: false, error: 'Username already taken. Please choose another username or log in.' };
  }

  const newAccount: UserAccount = {
    username: cleanUser,
    password,
    avatar,
    fullName: fullName?.trim() || cleanUser,
    email: email?.trim() || `${cleanUser.toLowerCase()}@arena.local`,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  saveAccount(newAccount);
  setCurrentUser(newAccount);

  return { success: true, user: newAccount };
}

export function logoutUser(): void {
  setCurrentUser(null);
}
