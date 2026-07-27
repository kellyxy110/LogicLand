import { describe, expect, it } from "vitest";
import { explainError } from "./error-anatomy";

describe("explainError", () => {
  it("explains a JS 'not a function' TypeError", () => {
    const a = explainError("TypeError: price.toUpperCase is not a function");
    expect(a.kind).toBe("TypeError");
    expect(a.technical).toContain("toUpperCase()");
    expect(a.learning.length).toBeGreaterThan(0);
    expect(a.original).toContain("toUpperCase");
  });

  it("explains reading a property of undefined", () => {
    const a = explainError("Cannot read properties of undefined (reading 'name')");
    expect(a.kind).toBe("TypeError");
    expect(a.technical).toContain(".name");
    expect(a.technical).toContain("undefined");
  });

  it("explains a Python NameError with the missing name", () => {
    const a = explainError("NameError: name 'total' is not defined");
    expect(a.kind).toBe("NameError");
    expect(a.learning).toContain("total");
  });

  it("explains dividing by zero and string+int", () => {
    expect(explainError("ZeroDivisionError: division by zero").kind).toBe("ZeroDivisionError");
    expect(
      explainError('TypeError: can only concatenate str (not "int") to str').learning,
    ).toMatch(/number into text/);
  });

  it("keeps the original and gives a generic explanation for unknown errors", () => {
    const a = explainError("Boom: something weird happened");
    expect(a.original).toBe("Boom: something weird happened");
    expect(a.learning).toMatch(/file and line/);
  });
});
