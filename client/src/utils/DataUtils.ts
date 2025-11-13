const MIN_OUT = 10;
const MAX_OUT = 100;

export const normalizeResponseTimes = <
  T extends Record<K, number>,
  K extends keyof T
>(
  checks: T[],
  key: K
): (T & { normalResponseTime: number })[] => {
  if (!Array.isArray(checks) || checks.length === 0)
    return checks as (T & {
      normalResponseTime: number;
    })[];

  if (checks.length === 1) {
    return [
      {
        ...checks[0],
        normalResponseTime: 50,
      },
    ];
  }

  const { min, max } = checks.reduce(
    (acc, check) => {
      if (check[key] > acc.max) acc.max = check[key];
      if (check[key] < acc.min) acc.min = check[key];
      return acc;
    },
    { max: -Infinity, min: Infinity }
  );

  const range = max - min || 1;

  return checks.map((check) => ({
    ...check,
    normalResponseTime:
      MIN_OUT + ((check[key] - min) * (MAX_OUT - MIN_OUT)) / range,
  }));
};
