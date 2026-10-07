import assert from "node:assert/strict";
import { reminderDecision, reminderSchema } from "./reminder-service";

const base = { tool: "typescript", deadline: "2026-09-10T09:00:00.000Z", owner: "dev@example.com", callbackUrl: "https://example.com/hooks/deadline" };
assert.equal(reminderDecision(reminderSchema.parse(base), new Date("2026-09-09T09:00:00.000Z")), "scheduled");
assert.equal(reminderDecision(reminderSchema.parse(base), new Date("2026-09-10T09:00:00.000Z")), "due");
assert.throws(() => reminderSchema.parse({ ...base, owner: "invalid" }));
console.log("reminder decision tests passed");
