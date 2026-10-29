import { scanCandidates } from "./discovery";

describe("scanCandidates", () => {
  it("lists the other 253 hosts of the /24", () => {
    const list = scanCandidates("192.168.1.20");
    expect(list).toHaveLength(253);
    expect(list[0]).toBe("192.168.1.1");
    expect(list).not.toContain("192.168.1.20");
    expect(list.at(-1)).toBe("192.168.1.254");
  });

  it("returns nothing for addresses it cannot use", () => {
    for (const bad of ["", "0.0.0", "fe80::1", "10.0.0.300", "a.b.c.d"]) expect(scanCandidates(bad)).toEqual([]);
  });
});
