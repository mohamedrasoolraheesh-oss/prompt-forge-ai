import { expect, test } from "bun:test";
import { escapeHtml } from "./html.ts";

test("customer-provided invoice markup is rendered as text", () => {
  expect(escapeHtml(`<img src=x onerror="alert(1)"> & 'customer'`)).toBe(
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;customer&#39;",
  );
});