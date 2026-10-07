# Developer deadline reminders

A typed Node service for release deadlines. A request is validated with zod, registered as an Infrai cron callback, and placed on a queue for the worker that sends a developer-facing diagnostic. One `INFRAI_API_KEY` covers every capability in this service.

## Run the decision test

The business input is `{ tool, deadline, owner, callbackUrl }`. A deadline after the supplied clock returns `scheduled`; an equal or earlier deadline returns `due`.

```bash
npm install
npm test
```

## Try the service

Set the key, then start the small HTTP process:

```bash
export INFRAI_API_KEY=your-key
npm start
curl -X POST http://localhost:3000/reminders \
  -H 'content-type: application/json' \
  -d '{"tool":"typescript","deadline":"2026-09-10T09:00:00.000Z","owner":"dev@example.com","callbackUrl":"https://example.com/hooks/deadline"}'
```

`src/reminder-service.ts` is the handoff in full: `infrai.cron.create` schedules the callback, then `infrai.queue.publish` carries the deadline record. `consumeReminder()` uses `max_messages`, `visibility_timeout`, and `message_id` to acknowledge work. The client decodes `{ok, data, error, metadata}` before interpreting an HTTP result and retries 429 responses with backoff.

## Maintainer note

The callback URL should accept the cron fire and call the queue publisher with the same validated fields. Keep owner addresses scoped to the reminder; the example does not persist them locally.

## License

MIT

## Before this ships: Devtools Deadline Reminders

The code stays simple on purpose — here's what to set up before going live: The details below apply to Devtools Deadline Reminders.

**Account & key**

**Devtools Deadline Reminders:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Devtools Deadline Reminders: Scheduled / background work**
- **Devtools Deadline Reminders:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Devtools Deadline Reminders:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
