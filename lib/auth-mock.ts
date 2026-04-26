/**
 * MOCK AUTH STATE
 * This is a temporary way to track login and onboarding state 
 * since SecureStore is not currently installed.
 */

export const AUTH_MOCK = {
  isLoggedIn: false,
  isOnboarded: false,
};

export const setOnboarded = (value: boolean) => {
  AUTH_MOCK.isOnboarded = value;
};

export const setLoggedIn = (value: boolean) => {
  AUTH_MOCK.isLoggedIn = value;
};
