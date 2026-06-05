import assert from "node:assert/strict";
import test from "node:test";
import { PathStatePriorityQueue } from "./PathStatePriorityQueue.js";

test("PathStatePriorityQueue pops states in ascending duration order", () => {
  const queue = new PathStatePriorityQueue({
    duration: 8,
    planetName: "Endor",
    remainingAutonomy: 0,
    route: ["Endor"],
  });

  queue.push({
    duration: 3,
    planetName: "Hoth",
    remainingAutonomy: 1,
    route: ["Hoth"],
  });
  queue.push({
    duration: 5,
    planetName: "Dagobah",
    remainingAutonomy: 2,
    route: ["Dagobah"],
  });

  assert.equal(queue.pop()?.duration, 3);
  assert.equal(queue.pop()?.duration, 5);
  assert.equal(queue.pop()?.duration, 8);
  assert.equal(queue.pop(), undefined);
  assert.equal(queue.isEmpty, true);
});
