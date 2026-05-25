const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  let orderBy;
  if (query.sort) {
    const [field, dir] = query.sort.split(':');
    orderBy = { [field]: dir === 'asc' ? 'asc' : 'desc' };
  }

  return { page, skip, take: limit, ...(orderBy ? { orderBy } : {}) };
}
