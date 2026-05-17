import { describe, expect, it } from "vitest";
import { buildListQuery, type ListQueryConfig } from "@/lib/services/listQuery";

type TestSortBy = "name" | "createdAt";
type TestFilters = {
  status: string;
  ownerId: string;
  search: string;
};
type TestWhere = {
  status?: string;
  ownerId?: string;
  name?: {
    contains: string;
  };
  AND?: TestWhere[];
};
type TestOrderBy = {
  name?: "asc" | "desc";
  createdAt?: "asc" | "desc";
};

const config: ListQueryConfig<TestSortBy, TestFilters, TestWhere, TestOrderBy> = {
  defaultSortBy: "name",
  defaultSortOrder: "asc",
  defaultPageSize: 20,
  maxPageSize: 50,
  emptyWhere: {},
  andWhere: (clauses) => ({ AND: clauses }),
  sortMap: {
    name: (order) => ({ name: order }),
    createdAt: (order) => ({ createdAt: order })
  },
  filterMap: {
    status: (status) => ({ status }),
    ownerId: (ownerId) => ({ ownerId }),
    search: (search) => ({ name: { contains: search } })
  }
};

describe("list query helper", () => {
  it("returns default where, order, skip, and take clauses", () => {
    expect(buildListQuery({}, config)).toEqual({
      where: {},
      orderBy: {
        name: "asc"
      },
      skip: 0,
      take: 20
    });
  });

  it("clamps pagination and applies explicit sort order", () => {
    expect(
      buildListQuery(
        {
          page: 3,
          pageSize: 500,
          sortBy: "createdAt",
          sortOrder: "desc"
        },
        config
      )
    ).toEqual({
      where: {},
      orderBy: {
        createdAt: "desc"
      },
      skip: 100,
      take: 50
    });
  });

  it("maps non-empty filters into an AND where clause", () => {
    expect(
      buildListQuery(
        {
          filters: {
            status: "active",
            ownerId: "",
            search: "acme"
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
          name: {
            contains: "acme"
          }
        }
      ]
    });
  });
});
