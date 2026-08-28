/**
 * A tiny in-memory stand-in for the Mongoose model surface the routes use.
 * Shared by the notes, collections and tags suites so they agree on semantics.
 */

export type Row = Record<string, unknown> & { _id: string };

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`;
}

const matchesCondition = (value: unknown, condition: unknown): boolean => {
  if (condition instanceof RegExp) {
    if (Array.isArray(value)) return value.some((v) => condition.test(String(v)));
    return condition.test(String(value ?? ""));
  }

  if (condition && typeof condition === "object") {
    const op = condition as Record<string, unknown>;
    if ("$size" in op) return Array.isArray(value) && value.length === op.$size;
    if ("$in" in op) {
      const wanted = op.$in as unknown[];
      if (Array.isArray(value)) return value.some((v) => wanted.includes(v));
      return wanted.includes(value);
    }
    if ("$all" in op) {
      const wanted = op.$all as unknown[];
      return Array.isArray(value) && wanted.every((w) => value.includes(w));
    }
  }

  // Mongo treats `{ field: null }` as "null or missing".
  if (condition === null) return value === null || value === undefined;

  // Matching a scalar against an array field means "array contains".
  if (Array.isArray(value)) return value.includes(condition);
  return value === condition;
};

export function matches(row: Row, query: Record<string, unknown>): boolean {
  return Object.entries(query).every(([key, condition]) => {
    if (key === "$or") {
      return (condition as Record<string, unknown>[]).some((sub) =>
        matches(row, sub),
      );
    }
    return matchesCondition(row[key], condition);
  });
}

export function applySort(rows: Row[], spec?: Record<string, 1 | -1>): Row[] {
  if (!spec) return rows;
  const [[field, direction]] = Object.entries(spec);
  return [...rows].sort((a, b) => {
    const av = a[field] as string | number;
    const bv = b[field] as string | number;
    if (av === bv) return 0;
    return (av > bv ? 1 : -1) * direction;
  });
}

/** Awaitable, and chainable with .sort() — matching how the routes call find(). */
export function findResult(rows: Row[]) {
  return {
    select: (_fields?: string) => findResult(rows),
    sort: (spec?: Record<string, 1 | -1>) => Promise.resolve(applySort(rows, spec)),
    then: <T>(
      onFulfilled: (value: Row[]) => T,
      onRejected?: (reason: unknown) => T,
    ) => Promise.resolve(rows).then(onFulfilled, onRejected),
  };
}

export function applyUpdate(row: Row, update: Record<string, unknown>) {
  if (update.$set) Object.assign(row, update.$set);
  if (update.$pull) {
    for (const [field, value] of Object.entries(
      update.$pull as Record<string, unknown>,
    )) {
      const current = row[field];
      if (Array.isArray(current)) {
        row[field] = current.filter((item) => item !== value);
      }
    }
  }
}
