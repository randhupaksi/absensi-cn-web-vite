import { describe, expect, it } from "vitest";
import {
  defaultProgramTypeForLevel,
  getProgramTypesForLevel,
  isClassPlacementAllowed,
} from "./academic-structure-schema";

describe("academic structure rules", () => {
  it("offers only program types supported by the selected level", () => {
    expect(getProgramTypesForLevel("smp")).toEqual(["GENERAL"]);
    expect(getProgramTypesForLevel("SMA")).toEqual([
      "GENERAL",
      "SCIENCE",
      "SOCIAL",
    ]);
    expect(getProgramTypesForLevel("SMK")).toEqual(["VOCATIONAL"]);
    expect(getProgramTypesForLevel("SD")).toEqual([]);
  });

  it("chooses a level-compatible default program type", () => {
    expect(defaultProgramTypeForLevel("SMA")).toBe("GENERAL");
    expect(defaultProgramTypeForLevel("SMK")).toBe("VOCATIONAL");
  });

  it("enforces current class and program placement rules", () => {
    expect(isClassPlacementAllowed("SMA", "X", "GENERAL")).toBe(true);
    expect(isClassPlacementAllowed("SMA", "XI", "SCIENCE")).toBe(true);
    expect(isClassPlacementAllowed("SMA", "X", "SCIENCE")).toBe(false);
    expect(isClassPlacementAllowed("SMA", "XI", "GENERAL")).toBe(false);
    expect(isClassPlacementAllowed("SMK", "XII", "VOCATIONAL")).toBe(true);
    expect(isClassPlacementAllowed("SMP", "VII", "GENERAL")).toBe(true);
  });
});
