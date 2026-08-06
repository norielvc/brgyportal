export const mergeOfficialsConfig = (defaults, fetched) => {
  if (!fetched || typeof fetched !== "object") return defaults;
  const result = { ...defaults };

  Object.keys(fetched).forEach((key) => {
    const def = defaults[key];
    const val = fetched[key];

    if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      def &&
      typeof def === "object" &&
      !Array.isArray(def)
    ) {
      result[key] = { ...def, ...val };
    } else if (val !== undefined) {
      result[key] = val;
    }
  });

  return result;
};
