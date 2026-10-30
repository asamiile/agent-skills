// Every locale has exactly the keys of the reference locale: a missing key shows a raw key path in the UI
import en from "./en.json";
import ja from "./ja.json";

const REFERENCE = en;
const OTHERS = { ja } as const;

function keys(node: object, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object" ? keys(value, path) : [path];
  });
}

describe("locale catalogs", () => {
  const expected = keys(REFERENCE).sort();
  for (const [locale, catalog] of Object.entries(OTHERS)) {
    it(`${locale} has the same keys as the reference`, () => {
      expect(keys(catalog).sort()).toEqual(expected);
    });
  }
});
