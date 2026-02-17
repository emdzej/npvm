import { describe, it, expect } from "vitest";
import { parseConventionalCommit, getHighestBumpType, type BumpType, type Commit } from "./commits.js";

describe("parseConventionalCommit", () => {
  it("should detect major bump from BREAKING CHANGE in body", () => {
    expect(parseConventionalCommit("feat: add feature", "BREAKING CHANGE: new API")).toBe("major");
  });

  it("should detect major bump from BREAKING-CHANGE in body", () => {
    expect(parseConventionalCommit("fix: something", "BREAKING-CHANGE: removed method")).toBe("major");
  });

  it("should detect major bump from ! in type", () => {
    expect(parseConventionalCommit("feat!: breaking feature")).toBe("major");
    expect(parseConventionalCommit("fix(scope)!: breaking fix")).toBe("major");
  });

  it("should detect minor bump from feat", () => {
    expect(parseConventionalCommit("feat: add new feature")).toBe("minor");
    expect(parseConventionalCommit("feat(scope): add feature")).toBe("minor");
  });

  it("should detect patch bump from fix", () => {
    expect(parseConventionalCommit("fix: bug fix")).toBe("patch");
    expect(parseConventionalCommit("fix(scope): fix issue")).toBe("patch");
  });

  it("should detect patch bump from perf", () => {
    expect(parseConventionalCommit("perf: improve performance")).toBe("patch");
  });

  it("should return none for other types", () => {
    expect(parseConventionalCommit("docs: update readme")).toBe("none");
    expect(parseConventionalCommit("chore: update deps")).toBe("none");
    expect(parseConventionalCommit("style: format code")).toBe("none");
    expect(parseConventionalCommit("refactor: cleanup")).toBe("none");
    expect(parseConventionalCommit("test: add tests")).toBe("none");
  });

  it("should return none for non-conventional commits", () => {
    expect(parseConventionalCommit("random commit message")).toBe("none");
    expect(parseConventionalCommit("WIP")).toBe("none");
    expect(parseConventionalCommit("Merge branch main")).toBe("none");
  });
});

describe("getHighestBumpType", () => {
  const makeCommit = (bumpType: BumpType): Commit => ({
    hash: "abc123",
    message: "test",
    bumpType,
  });

  it("should return major when any commit is major", () => {
    const commits = [
      makeCommit("patch"),
      makeCommit("major"),
      makeCommit("minor"),
    ];
    expect(getHighestBumpType(commits)).toBe("major");
  });

  it("should return minor when highest is minor", () => {
    const commits = [
      makeCommit("patch"),
      makeCommit("minor"),
      makeCommit("none"),
    ];
    expect(getHighestBumpType(commits)).toBe("minor");
  });

  it("should return patch when highest is patch", () => {
    const commits = [
      makeCommit("patch"),
      makeCommit("none"),
    ];
    expect(getHighestBumpType(commits)).toBe("patch");
  });

  it("should return none for empty array", () => {
    expect(getHighestBumpType([])).toBe("none");
  });

  it("should return none when all commits are none", () => {
    const commits = [
      makeCommit("none"),
      makeCommit("none"),
    ];
    expect(getHighestBumpType(commits)).toBe("none");
  });
});
