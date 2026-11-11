import { describe, expect, it } from "bun:test";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("keeps customer-provided markup inert in generated invoices", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)"> & 'customer'`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;customer&#39;",
    );
  });
});