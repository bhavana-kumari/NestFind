import test from "node:test";
import assert from "node:assert/strict";
import { propertySearchCache } from "./cacheService.js";

test("property search cache stores and clears entries", () => {
  propertySearchCache.clear();

  propertySearchCache.set("properties:test", { total: 1 });
  assert.deepEqual(propertySearchCache.get("properties:test"), { total: 1 });

  const stats = propertySearchCache.stats();
  assert.equal(stats.entries, 1);
  assert.equal(stats.hits, 1);

  propertySearchCache.clear();
  assert.equal(propertySearchCache.stats().entries, 0);
});
