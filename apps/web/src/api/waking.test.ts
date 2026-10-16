import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import { retryWhileWaking, wakeRetryDelay } from "./waking";

describe("retrying while the API wakes", () => {
  it("tries again when there's no answer or a server error, for a while", () => {
    expect(retryWhileWaking(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(retryWhileWaking(3, new ApiError(503, null))).toBe(true);
    expect(retryWhileWaking(15, new ApiError(502, null))).toBe(false);
  });

  it("takes a 4xx as the answer", () => {
    expect(retryWhileWaking(0, new ApiError(404, { error: "not_found" }))).toBe(false);
    expect(retryWhileWaking(0, new ApiError(400, null))).toBe(false);
  });

  it("waits longer each time, up to 15 s, about three minutes in all", () => {
    expect([0, 1, 2, 3, 4, 5].map(wakeRetryDelay)).toEqual([1000, 2000, 4000, 8000, 15000, 15000]);
    const total = Array.from({ length: 15 }, (_, i) => wakeRetryDelay(i)).reduce((a, b) => a + b);
    expect(total).toBe(180_000);
  });
});
