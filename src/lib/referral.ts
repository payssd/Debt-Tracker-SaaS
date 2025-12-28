// Referral system types and localStorage helpers

export type SubscriptionStatus = 'Active' | 'FreeTrial' | 'Expired';

export interface ReferralUser {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: Date;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  createdAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  status: 'Pending' | 'Completed';
  dateCreated: Date;
}

const CURRENT_USER_KEY = 'debtflow_current_user';
const USERS_KEY = 'debtflow_users';
const REFERRALS_KEY = 'debtflow_referrals';

// Generate a unique referral code
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DF';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get all users from localStorage
export function getUsers(): ReferralUser[] {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data).map((u: ReferralUser) => ({
      ...u,
      subscriptionEndDate: new Date(u.subscriptionEndDate),
      createdAt: new Date(u.createdAt),
    }));
  } catch {
    return [];
  }
}

// Save users to localStorage
export function saveUsers(users: ReferralUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Get current user
export function getCurrentUser(): ReferralUser | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  try {
    const user = JSON.parse(data);
    return {
      ...user,
      subscriptionEndDate: new Date(user.subscriptionEndDate),
      createdAt: new Date(user.createdAt),
    };
  } catch {
    return null;
  }
}

// Save current user
export function saveCurrentUser(user: ReferralUser): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  // Also update in users list
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  saveUsers(users);
}

// Get all referrals
export function getReferrals(): Referral[] {
  const data = localStorage.getItem(REFERRALS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data).map((r: Referral) => ({
      ...r,
      dateCreated: new Date(r.dateCreated),
    }));
  } catch {
    return [];
  }
}

// Save referrals
export function saveReferrals(referrals: Referral[]): void {
  localStorage.setItem(REFERRALS_KEY, JSON.stringify(referrals));
}

// Find user by referral code
export function findUserByReferralCode(code: string): ReferralUser | undefined {
  const users = getUsers();
  return users.find(u => u.referralCode.toUpperCase() === code.toUpperCase());
}

// Get referrals for a user
export function getUserReferrals(userId: string): Referral[] {
  const referrals = getReferrals();
  return referrals.filter(r => r.referrerId === userId);
}

// Add 30 days to a date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Process signup with referral
export function processSignupWithReferral(
  newUser: Omit<ReferralUser, 'id' | 'referralCode' | 'referralCount' | 'subscriptionStatus' | 'subscriptionEndDate' | 'createdAt'>,
  referralCode?: string
): { user: ReferralUser; referrer?: ReferralUser } {
  const users = getUsers();
  const referrals = getReferrals();
  
  const now = new Date();
  const userId = `user_${Date.now()}`;
  
  let referrer: ReferralUser | undefined;
  let subscriptionEndDate = addDays(now, 14); // Default 14-day trial
  let subscriptionStatus: SubscriptionStatus = 'FreeTrial';
  
  // Check if referral code is valid
  if (referralCode) {
    referrer = findUserByReferralCode(referralCode);
    
    // Prevent self-referral
    if (referrer && referrer.email !== newUser.email) {
      // Give new user 30 days instead of 14
      subscriptionEndDate = addDays(now, 30);
      
      // Update referrer's subscription
      if (referrer.subscriptionStatus === 'Active' || referrer.subscriptionStatus === 'FreeTrial') {
        referrer.subscriptionEndDate = addDays(referrer.subscriptionEndDate, 30);
      } else {
        referrer.subscriptionEndDate = addDays(now, 30);
        referrer.subscriptionStatus = 'FreeTrial';
      }
      referrer.referralCount += 1;
      
      // Update referrer in users list
      const referrerIndex = users.findIndex(u => u.id === referrer!.id);
      if (referrerIndex >= 0) {
        users[referrerIndex] = referrer;
      }
      
      // Create referral record
      const referral: Referral = {
        id: `ref_${Date.now()}`,
        referrerId: referrer.id,
        referredUserId: userId,
        referredUserName: newUser.name,
        referredUserEmail: newUser.email,
        status: 'Completed',
        dateCreated: now,
      };
      referrals.push(referral);
      saveReferrals(referrals);
    }
  }
  
  const user: ReferralUser = {
    id: userId,
    name: newUser.name,
    email: newUser.email,
    subscriptionStatus,
    subscriptionEndDate,
    referralCode: generateReferralCode(),
    referredBy: referrer?.id,
    referralCount: 0,
    createdAt: now,
  };
  
  users.push(user);
  saveUsers(users);
  saveCurrentUser(user);
  
  return { user, referrer };
}

// Initialize demo user if none exists
export function initializeDemoUser(): ReferralUser {
  let user = getCurrentUser();
  if (!user) {
    user = {
      id: 'user_demo',
      name: 'John Doe',
      email: 'john@example.com',
      subscriptionStatus: 'FreeTrial',
      subscriptionEndDate: addDays(new Date(), 14),
      referralCode: generateReferralCode(),
      referralCount: 0,
      createdAt: new Date(),
    };
    saveCurrentUser(user);
  }
  return user;
}

// Get referral link
export function getReferralLink(referralCode: string): string {
  return `${window.location.origin}/signup?ref=${referralCode}`;
}
