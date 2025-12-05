import { describe, expect, test } from "bun:test";

/**
 * Asserts that a value is not null.
 * @param value - Any value.
 */
export function assertNotNull<T>(value: T): asserts value is NonNullable<T> {
        expect(value).not.toBeNull();
}

describe("assertNotNull", () => {
        test("allows truthy values to pass", () => {
                const value: string | null = "hello";

                assertNotNull(value);

                expect(typeof value).toBe("string");
        });

        test("throws for null values", () => {
                expect(() => assertNotNull(null)).toThrow();
        });
});
