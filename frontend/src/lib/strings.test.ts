import { describe, test, expect } from "vitest";
import { canonicalize, removeInitSlash } from "./strings.ts";

describe("canonicalize", () => {
  test("returns the item unchanged at the root (empty base)", () => {
    expect(canonicalize("downloads", "")).toBe("downloads");
  });

  test("joins the item onto the current directory", () => {
    expect(canonicalize("sub", "downloads")).toBe("downloads/sub");
  });

  test("joins onto a deeply nested directory", () => {
    expect(canonicalize("file.txt", "a/b/c")).toBe("a/b/c/file.txt");
  });

  test("never returns a leading slash (safe as a backend path segment)", () => {
    expect(canonicalize("x", "/foo")).toBe("foo/x");
  });

  test("collapses duplicate slashes", () => {
    expect(canonicalize("/img.png", "downloads")).toBe("downloads/img.png");
  });
});

describe("removeInitSlash", () => {
  test("strips a single leading slash", () => {
    expect(removeInitSlash("/foo/bar")).toBe("foo/bar");
  });

  test("leaves a slash-less path untouched", () => {
    expect(removeInitSlash("foo/bar")).toBe("foo/bar");
  });
});
