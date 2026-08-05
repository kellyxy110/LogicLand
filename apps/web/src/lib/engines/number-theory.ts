// Number Theory engine (ADR-030) — pure, deterministic arithmetic on whole
// numbers: primality, prime factorization, divisors, GCD/LCM via the
// Euclidean algorithm, modular exponentiation via square-and-multiply, and a
// Sieve of Eratosthenes. No eval, no network, no LLM — every step is a real
// computation (ADR-015), bounded so the UI never hangs on a huge input.

export interface Step {
  label: string;
  expr: string;
}
export type NTResult = { ok: true; steps: Step[]; result: string } | { ok: false; error: string };

export const MAX_FACTORIZE = 10_000_000;
export const MAX_SIEVE = 1000;

function parsePositiveInt(src: string): number | null {
  const trimmed = src.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isSafeInteger(n) ? n : null;
}

// --- Primality & factorization -----------------------------------------------
export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n < 4) return true; // 2, 3
  if (n % 2 === 0) return false;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

export interface PrimeFactor {
  prime: number;
  exponent: number;
}

/** Trial division up to sqrt(n) — deterministic, bounded by MAX_FACTORIZE. */
export function primeFactorize(n: number): PrimeFactor[] {
  const factors: PrimeFactor[] = [];
  let remaining = n;
  for (let d = 2; d * d <= remaining; d++) {
    let exp = 0;
    while (remaining % d === 0) {
      remaining /= d;
      exp++;
    }
    if (exp > 0) factors.push({ prime: d, exponent: exp });
  }
  if (remaining > 1) factors.push({ prime: remaining, exponent: 1 });
  return factors;
}

export function factorsToString(factors: PrimeFactor[]): string {
  if (factors.length === 0) return "1";
  return factors.map((f) => (f.exponent === 1 ? `${f.prime}` : `${f.prime}^${f.exponent}`)).join(" · ");
}

export function divisorsFromFactors(factors: PrimeFactor[]): number[] {
  let divs = [1];
  for (const { prime, exponent } of factors) {
    const next: number[] = [];
    let pw = 1;
    for (let e = 0; e <= exponent; e++) {
      for (const d of divs) next.push(d * pw);
      pw *= prime;
    }
    divs = next;
  }
  return divs.sort((a, b) => a - b);
}

export type DivisorClass = "perfect" | "abundant" | "deficient";

export function classifyByDivisorSum(n: number, divisors: number[]): DivisorClass {
  const properSum = divisors.reduce((s, d) => s + d, 0) - n;
  if (properSum === n) return "perfect";
  return properSum > n ? "abundant" : "deficient";
}

export function factorize(src: string): NTResult {
  const n = parsePositiveInt(src);
  if (n === null) return { ok: false, error: "Enter a whole number, like 60." };
  if (n < 2) return { ok: false, error: "Factorization needs a whole number of 2 or more." };
  if (n > MAX_FACTORIZE) return { ok: false, error: `That's too large to factor here — try a number under ${MAX_FACTORIZE.toLocaleString()}.` };

  const steps: Step[] = [{ label: "Start", expr: String(n) }];
  let remaining = n;
  for (let d = 2; d * d <= remaining; d++) {
    while (remaining % d === 0) {
      steps.push({ label: `Divide by ${d}`, expr: `${remaining} ÷ ${d} = ${remaining / d}` });
      remaining /= d;
    }
  }
  if (remaining > 1) steps.push({ label: `${remaining} is prime`, expr: "stop — no smaller factor divides it" });

  const factors = primeFactorize(n);
  const factored = factorsToString(factors);
  steps.push({ label: "Prime factorization", expr: factored });

  const divs = divisorsFromFactors(factors);
  steps.push({ label: `Divisors (${divs.length})`, expr: divs.join(", ") });
  const sum = divs.reduce((s, d) => s + d, 0);
  steps.push({ label: "Sum of divisors", expr: String(sum) });

  let result = `${n} = ${factored}`;
  if (factors.length === 1 && factors[0].exponent === 1) {
    steps.push({ label: "Prime or composite", expr: "prime" });
    result = `${n} is prime`;
  } else {
    steps.push({ label: "Prime or composite", expr: "composite" });
    const cls = classifyByDivisorSum(n, divs);
    steps.push({ label: "Classify", expr: cls });
    result = `${n} = ${factored} (${cls})`;
  }
  return { ok: true, steps, result };
}

// --- GCD / LCM via the Euclidean algorithm -----------------------------------
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a / gcd(a, b)) * b);
}

export function gcdLcm(srcA: string, srcB: string): NTResult {
  const a = parsePositiveInt(srcA);
  const b = parsePositiveInt(srcB);
  if (a === null || b === null) return { ok: false, error: "Enter two whole numbers, like 48 and 18." };
  if (a === 0 && b === 0) return { ok: false, error: "GCD/LCM of 0 and 0 is undefined." };

  const steps: Step[] = [{ label: "Start", expr: `gcd(${a}, ${b})` }];
  let x = a;
  let y = b;
  while (y !== 0) {
    const q = Math.floor(x / y);
    const r = x % y;
    steps.push({ label: `${x} = ${q} × ${y} + ${r}`, expr: r === 0 ? `gcd = ${y}` : `next: gcd(${y}, ${r})` });
    [x, y] = [y, r];
  }
  const g = x;
  const l = lcm(a, b);
  steps.push({ label: "GCD", expr: String(g) });
  steps.push({ label: "LCM (a × b ÷ gcd)", expr: `${a} × ${b} ÷ ${g} = ${l}` });
  return { ok: true, steps, result: `gcd = ${g}, lcm = ${l}` };
}

// --- Modular exponentiation via square-and-multiply --------------------------
export function modPow(base: number, exp: number, mod: number): number {
  if (mod === 1) return 0;
  let result = 1;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0) {
    if (e & 1) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1;
  }
  return result;
}

export function modularArithmetic(srcBase: string, srcExp: string, srcMod: string): NTResult {
  const base = parsePositiveInt(srcBase);
  const exp = parsePositiveInt(srcExp);
  const mod = parsePositiveInt(srcMod);
  if (base === null || exp === null || mod === null) return { ok: false, error: "Enter three whole numbers: base, exponent, modulus." };
  if (mod === 0) return { ok: false, error: "The modulus can't be 0." };
  if (exp > 100000) return { ok: false, error: "That exponent is too large here." };

  const steps: Step[] = [{ label: "Start", expr: `${base}^${exp} mod ${mod}` }];
  steps.push({ label: `${base} mod ${mod}`, expr: String(((base % mod) + mod) % mod) });

  const bits = exp.toString(2);
  steps.push({ label: "Exponent in binary", expr: `${exp} = 0b${bits}` });

  let result = 1;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  let bitIndex = 0; // 0 = least-significant bit; the loop consumes e's bits LSB-first
  while (e > 0) {
    const bit = e & 1;
    if (bit) {
      result = (result * b) % mod;
      steps.push({ label: `Bit ${bitIndex} = 1`, expr: `result = result × square mod ${mod} = ${result}` });
    } else {
      steps.push({ label: `Bit ${bitIndex} = 0`, expr: `result unchanged = ${result}` });
    }
    b = (b * b) % mod;
    e >>= 1;
    bitIndex++;
  }
  steps.push({ label: "Result", expr: String(result) });
  return { ok: true, steps, result: `${base}^${exp} mod ${mod} = ${result}` };
}

// --- Sieve of Eratosthenes -----------------------------------------------------
export function sieveOfEratosthenes(limit: number): number[] {
  if (limit < 2) return [];
  const isComposite = new Uint8Array(limit + 1);
  const primes: number[] = [];
  for (let n = 2; n <= limit; n++) {
    if (!isComposite[n]) {
      primes.push(n);
      for (let m = n * n; m <= limit; m += n) isComposite[m] = 1;
    }
  }
  return primes;
}

export function primeSieve(src: string): NTResult {
  const limit = parsePositiveInt(src);
  if (limit === null) return { ok: false, error: "Enter a whole number, like 100." };
  if (limit < 2) return { ok: false, error: "Pick a limit of 2 or more." };
  if (limit > MAX_SIEVE) return { ok: false, error: `Pick a limit of ${MAX_SIEVE} or less so the grid stays readable.` };

  const primes = sieveOfEratosthenes(limit);
  const steps: Step[] = [
    { label: "Method", expr: "Sieve of Eratosthenes — cross off multiples of each prime, starting from 2" },
    { label: `Primes up to ${limit}`, expr: String(primes.length) },
    { label: "List", expr: primes.join(", ") },
  ];
  return { ok: true, steps, result: `${primes.length} primes up to ${limit}` };
}

// --- Presets -------------------------------------------------------------------
export const FACTORIZE_PRESETS = ["60", "97", "1024", "999983"];
export const GCD_PRESETS: [string, string][] = [["48", "18"], ["1071", "462"], ["17", "13"]];
export const MOD_PRESETS: [string, string, string][] = [["7", "128", "13"], ["2", "10", "1000"], ["3", "200", "7"]];
export const SIEVE_PRESETS = ["50", "100", "200"];
