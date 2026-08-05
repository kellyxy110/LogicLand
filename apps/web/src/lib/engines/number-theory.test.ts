import { describe, expect, it } from "vitest";
import {
  classifyByDivisorSum,
  divisorsFromFactors,
  factorize,
  factorsToString,
  gcd,
  gcdLcm,
  isPrime,
  lcm,
  modPow,
  modularArithmetic,
  primeFactorize,
  primeSieve,
  sieveOfEratosthenes,
} from "./number-theory";

describe("number theory engine (ADR-030)", () => {
  describe("isPrime", () => {
    it("identifies primes and composites", () => {
      expect(isPrime(2)).toBe(true);
      expect(isPrime(3)).toBe(true);
      expect(isPrime(97)).toBe(true);
      expect(isPrime(4)).toBe(false);
      expect(isPrime(1)).toBe(false);
      expect(isPrime(0)).toBe(false);
      expect(isPrime(-7)).toBe(false);
    });
  });

  describe("primeFactorize / factorsToString", () => {
    it("factors a composite number", () => {
      expect(primeFactorize(60)).toEqual([{ prime: 2, exponent: 2 }, { prime: 3, exponent: 1 }, { prime: 5, exponent: 1 }]);
      expect(factorsToString(primeFactorize(60))).toBe("2^2 · 3 · 5");
    });

    it("factors a prime as itself", () => {
      expect(primeFactorize(97)).toEqual([{ prime: 97, exponent: 1 }]);
    });

    it("factors a power of a single prime", () => {
      expect(primeFactorize(1024)).toEqual([{ prime: 2, exponent: 10 }]);
    });
  });

  describe("divisorsFromFactors / classifyByDivisorSum", () => {
    it("lists all divisors of 28 and classifies it perfect", () => {
      const factors = primeFactorize(28);
      const divs = divisorsFromFactors(factors);
      expect(divs).toEqual([1, 2, 4, 7, 14, 28]);
      expect(classifyByDivisorSum(28, divs)).toBe("perfect");
    });

    it("classifies 12 as abundant and 8 as deficient", () => {
      expect(classifyByDivisorSum(12, divisorsFromFactors(primeFactorize(12)))).toBe("abundant");
      expect(classifyByDivisorSum(8, divisorsFromFactors(primeFactorize(8)))).toBe("deficient");
    });
  });

  describe("factorize (steps + friendly errors)", () => {
    it("produces a full step trace and honest result for a composite", () => {
      const r = factorize("60");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toContain("2^2 · 3 · 5");
        expect(r.steps.some((s) => s.label === "Prime or composite" && s.expr === "composite")).toBe(true);
      }
    });

    it("reports a prime plainly, no classify step", () => {
      const r = factorize("97");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toBe("97 is prime");
        expect(r.steps.some((s) => s.label === "Classify")).toBe(false);
      }
    });

    it("rejects 0, 1, negatives and non-numbers", () => {
      expect(factorize("1").ok).toBe(false);
      expect(factorize("0").ok).toBe(false);
      expect(factorize("-5").ok).toBe(false);
      expect(factorize("abc").ok).toBe(false);
      expect(factorize("").ok).toBe(false);
    });

    it("rejects numbers over the bound with a friendly message", () => {
      const r = factorize("99999999999");
      expect(r.ok).toBe(false);
    });
  });

  describe("gcd / lcm", () => {
    it("computes gcd and lcm directly", () => {
      expect(gcd(48, 18)).toBe(6);
      expect(lcm(48, 18)).toBe(144);
      expect(gcd(17, 13)).toBe(1); // coprime
    });

    it("traces the Euclidean algorithm", () => {
      const r = gcdLcm("48", "18");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toBe("gcd = 6, lcm = 144");
        expect(r.steps.length).toBeGreaterThan(2);
      }
    });

    it("rejects non-numeric input", () => {
      expect(gcdLcm("x", "3").ok).toBe(false);
    });
  });

  describe("modPow / modularArithmetic", () => {
    it("computes modular exponentiation correctly", () => {
      // Cross-checked independently via BigInt exponentiation, not the same algorithm.
      expect(modPow(7, 128, 13)).toBe(Number(7n ** 128n % 13n));
      expect(modPow(2, 10, 1000)).toBe(24); // 1024 mod 1000
      expect(modPow(3, 0, 7)).toBe(1);
    });

    it("traces square-and-multiply with correct bit order", () => {
      const r = modularArithmetic("2", "10", "1000");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.result).toBe("2^10 mod 1000 = 24");
        // 10 in binary is 1010 — bit 1 and bit 3 are set (LSB = bit 0).
        expect(r.steps.some((s) => s.label === "Bit 1 = 1")).toBe(true);
        expect(r.steps.some((s) => s.label === "Bit 3 = 1")).toBe(true);
        expect(r.steps.some((s) => s.label === "Bit 0 = 0")).toBe(true);
      }
    });

    it("rejects a zero modulus", () => {
      expect(modularArithmetic("2", "3", "0").ok).toBe(false);
    });
  });

  describe("sieveOfEratosthenes / primeSieve", () => {
    it("finds all primes up to a limit", () => {
      expect(sieveOfEratosthenes(30)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    });

    it("reports a friendly result", () => {
      const r = primeSieve("50");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.result).toBe("15 primes up to 50");
    });

    it("rejects a limit above the bound", () => {
      expect(primeSieve("1000000").ok).toBe(false);
    });
  });
});
