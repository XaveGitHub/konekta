import type { Contact } from "@/lib/mocks/contactsStore";
import { bootstrapContacts } from "@/lib/mocks/contactsStore";
import React, { createContext, useCallback, useContext, useState } from "react";

type ContactsContextType = {
  contacts: Contact[];
  addContact: (name: string, phone: string) => Contact;
};

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(bootstrapContacts);

  const addContact = useCallback((name: string, phone: string): Contact => {
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name,
      username: `@${name.toLowerCase().replace(/\s+/g, "")}`,
      phone,
      status: "Available",
      avatarUrl: undefined,
      isOnline: false,
    };
    setContacts((prev) => [newContact, ...prev]);
    return newContact;
  }, []);

  return (
    <ContactsContext.Provider value={{ contacts, addContact }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error("useContacts must be used within a ContactsProvider");
  }
  return context;
}
