// lib/pagination.ts

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    lastPage: number;
    currentPage: number;
    perPage: number;
    prev: number | null;
    next: number | null;
  };
}

export async function paginate<T, Args>(
  model: any, // Represents prisma.task, prisma.user, etc.
  queryArgs: Args = {} as Args, // The 'where', 'include', 'orderBy' object
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  // 1. Extract 'where' from args to use in count()
  // We perform a shallow copy to ensure we don't mutate the original object
  const { where } = queryArgs as any;

  // 2. Run queries in parallel
  const [data, total] = await Promise.all([
    model.findMany({
      ...queryArgs,
      skip,
      take: limit,
    }),
    model.count({ where }),
  ]);

  const lastPage = Math.ceil(total / limit);

  return {
    data: data as T[],
    meta: {
      total,
      lastPage,
      currentPage: page,
      perPage: limit,
      prev: page > 1 ? page - 1 : null,
      next: page < lastPage ? page + 1 : null,
    },
  };
}
