import { badRequest } from './errors';

/** Password rule shared by sign-in changes and admin-set credentials. */
export function assertStrongPassword(password: string) {
  if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw badRequest('PASSWORD_WEAK', 'Use at least 10 characters with letters and numbers');
  }
}
