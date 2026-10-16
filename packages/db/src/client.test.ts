import { describe, expect, it } from "vitest";
import { withoutChannelBinding } from "./client.ts";

describe("withoutChannelBinding", () => {
  it("drops the option wherever it sits, keeping the rest", () => {
    const base = "postgresql://u:p@ep-x.aws.neon.tech/neondb";
    expect(withoutChannelBinding(`${base}?sslmode=require&channel_binding=require`)).toBe(
      `${base}?sslmode=require`,
    );
    expect(withoutChannelBinding(`${base}?channel_binding=require&sslmode=require`)).toBe(
      `${base}?sslmode=require`,
    );
    expect(withoutChannelBinding(`${base}?channel_binding=require`)).toBe(base);
  });

  it("leaves other addresses alone", () => {
    const local = "postgres://ffvii:ffvii@localhost:5433/ffvii";
    expect(withoutChannelBinding(local)).toBe(local);
  });
});
