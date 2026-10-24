export function nonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be finite and non-negative`);
  }
}
export function positive(value: number, name: string): void {
  nonNegative(value, name);
  if (value === 0) {
    throw new RangeError(`${name} must be positive`);
  }
}
export function integer(value: number, name: string): void {
  nonNegative(value, name);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer`);
  }
}
