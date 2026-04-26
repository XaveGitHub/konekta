/**
 * Pretend contacts directory — seed list for ContactsContext.
 */
import { mockContacts, type Contact } from '@/constants/mockContacts';

export type { Contact };

export function bootstrapContacts(): Contact[] {
  return [...mockContacts];
}

export async function loadInitialContacts(): Promise<Contact[]> {
  return Promise.resolve(bootstrapContacts());
}
