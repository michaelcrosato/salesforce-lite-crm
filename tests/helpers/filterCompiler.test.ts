import { describe, expect, it } from "vitest";
import {
  compileFilterExpression,
  fieldContains,
  fieldEquals,
  fieldGte,
  fieldIn,
  fieldLte,
  orFilters
} from "@/lib/services/filterCompiler";
import {
  buildListQuery,
  type ListQueryConfig
} from "@/lib/services/listQuery";

type TestSortBy = "name" | "createdAt";
type TestFilters = {
  status: string;
  statuses: string[];
  accountId: string;
  search: string;
  createdFrom: Date;
  createdTo: Date;
};
type TestWhere = {
  status?: string | { in: string[] };
  accountId?: string;
  firstName?: { contains: string };
  lastName?: { contains: string };
  createdAt?: { gte?: Date; lte?: Date };
  OR?: TestWhere[];
  AND?: TestWhere[];
};
type TestOrderBy = {
  name?: "asc" | "desc";
  createdAt?: "asc" | "desc";
};

const config: ListQueryConfig<
  TestSortBy,
  TestFilters,
  TestWhere,
  TestOrderBy
> = {
  defaultSortBy: "name",
  defaultSortOrder: "asc",
  emptyWhere: {},
  andWhere: (clauses) => ({ AND: clauses }),
  sortMap: {
    name: (order) => ({ name: order }),
    createdAt: (order) => ({ createdAt: order })
  },
  filterMap: {
    status: (status) => fieldEquals(["status"], status),
    statuses: (statuses) => fieldIn(["status"], statuses),
    accountId: (accountId) => fieldEquals(["accountId"], accountId),
    search: (search) =>
      orFilters([
        fieldContains(["firstName"], search),
        fieldContains(["lastName"], search)
      ]),
    createdFrom: (createdFrom) => fieldGte(["createdAt"], createdFrom),
    createdTo: (createdTo) => fieldLte(["createdAt"], createdTo)
  }
};

describe("filter compiler", () => {
  it("compiles scalar equals and contains expressions", () => {
    expect(compileFilterExpression<TestWhere>(fieldEquals(["status"], "active"))).toEqual({
      status: "active"
    });

    expect(
      compileFilterExpression<TestWhere>(fieldContains(["firstName"], "Ada"))
    ).toEqual({
      firstName: {
        contains: "Ada"
      }
    });
  });

  it("compiles set membership and skips empty sets", () => {
    expect(
      compileFilterExpression<TestWhere>(
        fieldIn(["status"], ["active", "paused"])
      )
    ).toEqual({
      status: {
        in: ["active", "paused"]
      }
    });

    expect(compileFilterExpression<TestWhere>(fieldIn(["status"], []))).toBeUndefined();
  });

  it("routes list filters through the AST compiler with AND parity", () => {
    expect(
      buildListQuery(
        {
          filters: {
            status: "active",
            accountId: "account-1",
            search: "Ada"
          }
        },
        config
      ).where
    ).toEqual({
      AND: [
        {
          status: "active"
        },
        {
          accountId: "account-1"
        },
        {
          OR: [
            {
              firstName: {
                contains: "Ada"
              }
            },
            {
              lastName: {
                contains: "Ada"
              }
            }
          ]
        }
      ]
    });
  });

  it("preserves bounded range filters as separate Prisma clauses", () => {
    const createdFrom = new Date("2026-01-01T00:00:00.000Z");
    const createdTo = new Date("2026-01-31T23:59:59.000Z");

    expect(
      buildListQuery(
        {
          filters: {
            createdFrom,
            createdTo
          }
        },
        config
      ).where
    ).toEqual({
      AND: [
        {
          createdAt: {
            gte: createdFrom
          }
        },
        {
          createdAt: {
            lte: createdTo
          }
        }
      ]
    });
  });
});
