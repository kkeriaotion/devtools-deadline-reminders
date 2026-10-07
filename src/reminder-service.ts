import { z } from "zod";
import { infrai } from "./infrai";

export const reminderSchema = z.object({ tool: z.string().min(1), deadline: z.string().datetime(), owner: z.string().email(), callbackUrl: z.string().url() });
export type Reminder = z.infer<typeof reminderSchema>;

const reminderQueue = "developer-deadline-reminders";

export function reminderDecision(reminder: Reminder, now = new Date()): "due" | "scheduled" {
  return new Date(reminder.deadline).getTime() <= now.getTime() ? "due" : "scheduled";
}

export async function scheduleReminder(input: unknown) {
  const reminder = reminderSchema.parse(input);
  const decision = reminderDecision(reminder);
  const message = await infrai.queue.publish({ queue: reminderQueue, payload: { kind: "developer-deadline", tool: reminder.tool, deadline: reminder.deadline, owner: reminder.owner, decision } });
  const job = await infrai.cron.create({ cron_expr: "0 * * * *", task: reminder.callbackUrl });
  return { decision, jobId: job.job_id, messageId: message.message_id };
}

export async function consumeReminder(): Promise<unknown[]> {
  const batch = await infrai.queue.consume({ queue: reminderQueue, max_messages: 10, visibility_timeout: 60 });
  for (const message of batch.messages ?? []) await infrai.queue.ack({ queue: reminderQueue, message_id: message.message_id });
  return batch.messages ?? [];
}
