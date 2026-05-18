export type DuplicateContact = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export type DuplicateLead = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export type DuplicateGroup<T> = {
  reason: string;
  records: T[];
};

function norm(str: string | null | undefined): string {
  return (str ?? "").toLowerCase().trim();
}

export function findDuplicateContacts(contacts: readonly DuplicateContact[]): DuplicateGroup<DuplicateContact>[] {
  const byEmail = new Map<string, DuplicateContact[]>();
  const byNamePhone = new Map<string, DuplicateContact[]>();

  for (const c of contacts) {
    const email = norm(c.email);
    if (email) {
      if (!byEmail.has(email)) byEmail.set(email, []);
      byEmail.get(email)!.push(c);
    }

    const key = `${norm(c.firstName)}|${norm(c.lastName)}|${norm(c.phone)}`;
    if (!byNamePhone.has(key)) byNamePhone.set(key, []);
    byNamePhone.get(key)!.push(c);
  }

  const groups: DuplicateGroup<DuplicateContact>[] = [];

  for (const [email, list] of byEmail) {
    if (list.length > 1) {
      groups.push({ reason: `email:${email}`, records: [...list] });
    }
  }

  for (const [key, list] of byNamePhone) {
    if (list.length > 1) {
      // avoid duplicating pure email groups if they also match name+phone (rare)
      const already = groups.some((g) => g.records.some((r) => list.some((l) => l.id === r.id)));
      if (!already) {
        groups.push({ reason: `name+phone:${key}`, records: [...list] });
      }
    }
  }

  return groups;
}

export function findDuplicateLeads(leads: readonly DuplicateLead[]): DuplicateGroup<DuplicateLead>[] {
  // same logic, reuse by casting shape
  const contactsLike = leads as unknown as DuplicateContact[];
  const contactGroups = findDuplicateContacts(contactsLike);
  return contactGroups.map((g) => ({
    reason: g.reason,
    records: g.records as unknown as DuplicateLead[]
  }));
}
