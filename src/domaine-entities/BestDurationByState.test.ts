import assert from "node:assert/strict";
import test from "node:test";
import { BestDurationByState } from "./BestDurationByState.js";

test("BestDurationByState tracks better or equal durations per planet and autonomy", () => {
  const bestDurationByState = new BestDurationByState();

  bestDurationByState.remember({
    duration: 5,
    planetName: "Hoth",
    remainingAutonomy: 2,
    route: ["Tatooine", "Hoth"],
  });

  assert.equal(
    bestDurationByState.hasBetterOrEqual({
      duration: 6,
      planetName: "Hoth",
      remainingAutonomy: 2,
      route: ["Other"],
    }),
    true,
  );

  assert.equal(
    bestDurationByState.hasBetterOrEqual({
      duration: 4,
      planetName: "Hoth",
      remainingAutonomy: 2,
      route: ["Other"],
    }),
    false,
  );

  assert.equal(
    bestDurationByState.hasBetterOrEqual({
      duration: 6,
      planetName: "Hoth",
      remainingAutonomy: 1,
      route: ["Other"],
    }),
    false,
  );
});
