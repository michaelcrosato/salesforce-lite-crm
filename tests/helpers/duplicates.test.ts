import { describe, expect, it } from "vitest";
import {
  findDuplicateContacts,
  findDuplicateLeads,
  type DuplicateContact,
  type DuplicateLead
} from "@/lib/business/duplicates";

describe("duplicate detector", () => {
  const baseContacts: DuplicateContact[] = [
    { id: "c1", email: "a@example.com", firstName: "Ana", lastName: "Lee", phone: "111-1111" },
    { id: "c2", email: "A@EXAMPLE.COM", firstName: "Ana", lastName: "Lee", phone: "111-1111" },
    { id: "c3", email: "b@example.com", firstName: "Bob", lastName: "Kim", phone: "222-2222" },
    { id: "c4", email: null, firstName: "Bob", lastName: "Kim", phone: "222-2222" },
    { id: "c5", email: "c@example.com", firstName: "Cara", lastName: "Fox", phone: null }
  ];

  it("groups by lowercase email match", () => {
    const groups = findDuplicateContacts(baseContacts);
    const emailGroup = groups.find((g) => g.reason.startsWith("email:"));
    expect(emailGroup).toBeDefined();
    expect(emailGroup!.records.map((r) => r.id).sort()).toEqual(["c1", "c2"]);
  });

  it("groups by lowercase first+last+phone when no email match", () => {
    const groups = findDuplicateContacts(baseContacts);
    const nameGroup = groups.find((g) => g.reason.startsWith("name+phone:"));
    expect(nameGroup).toBeDefined();
    expect(nameGroup!.records.map((r) => r.id).sort()).toEqual(["c3", "c4"]);
  });

  it("returns empty for no duplicates", () => {
    const unique = [baseContacts[0], baseContacts[2], baseContacts[4]];
    expect(findDuplicateContacts(unique)).toHaveLength(0);
  });

  it("never mutates input", () => {
    const copy = [...baseContacts];
    findDuplicateContacts(baseContacts);
    expect(baseContacts).toEqual(copy);
  });

  it("findDuplicateLeads works on Lead shape (same fields)", () => {
    const leads: DuplicateLead[] = baseContacts.map((c) => ({ ...c, id: "l" + c.id }));
    const groups = findDuplicateLeads(leads);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].records[0].id.startsWith("l")).toBe(true);
  });
});
