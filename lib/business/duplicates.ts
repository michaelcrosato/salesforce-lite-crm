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

type DuplicateRecord = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
};

function norm(str: string | null | undefined): string {
  return (str ?? "").toLowerCase().trim();
}

function findDuplicates<T extends DuplicateRecord>(records: readonly T[]): DuplicateGroup<T>[] {
  const byEmail = new Map<string, T[]>();
  const byNamePhone = new Map<string, T[]>();

  for (const record of records) {
    const email = norm(record.email);
    if (email) {
      if (!byEmail.has(email)) byEmail.set(email, []);
      byEmail.get(email)!.push(record);
    }

    const key = `${norm(record.firstName)}|${norm(record.lastName)}|${norm(record.phone)}`;
    if (!byNamePhone.has(key)) byNamePhone.set(key, []);
    byNamePhone.get(key)!.push(record);
  }

  const groups: DuplicateGroup<T>[] = [];

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

export function findDuplicateContacts(contacts: readonly DuplicateContact[]): DuplicateGroup<DuplicateContact>[] {
  return findDuplicates(contacts);
}

export function findDuplicateLeads(leads: readonly DuplicateLead[]): DuplicateGroup<DuplicateLead>[] {
  return findDuplicates(leads);
}
