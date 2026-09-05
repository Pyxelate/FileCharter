import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount anything rendered in a test after it finishes so the jsdom document
// starts clean for the next test.
afterEach(() => {
  cleanup();
});
