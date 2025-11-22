import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for Map.groupBy (not available in Node 20)
if (typeof Map.groupBy === "undefined") {
  Map.groupBy = function (items, keySelector) {
    const map = new Map();
    for (const item of items) {
      const key = keySelector(item);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(item);
    }
    // Override entries() to return an array instead of an iterator
    const originalEntries = map.entries.bind(map);
    map.entries = function () {
      return Array.from(originalEntries());
    };
    return map;
  };
}
