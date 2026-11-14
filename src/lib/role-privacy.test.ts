import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("restricts database role checks to the authenticated caller", () => {
  const sql = readFileSync(
    new URL(
      "../../drizzle/migrations/0001_scope_role_checks_to_authenticated_caller.sql",
      import.meta.url,
    ),
    "utf8",
  );
  expect(sql).toMatch(/CASE WHEN _user_id = auth\.uid\(\) THEN EXISTS/);
  expect(sql).toMatch(/user_id = auth\.uid\(\) AND role = _role/);
  expect(sql).toContain("ELSE false");
  expect(sql).toMatch(/REVOKE ALL[\s\S]*FROM PUBLIC, anon/);
});
