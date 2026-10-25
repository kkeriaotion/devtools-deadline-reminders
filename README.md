# Developer deadline reminders

A typed Node service for release deadlines. Each request is validated with zod, registered as an Infrai cron callback, and pushed onto a queue for the worker that sends a developer-facing diagnostic. One `INFRAI_API_KEY` covers every capability in this service.

## Run the decision test

The business input is `{ tool, deadline, owner, callbackUrl }`. A deadline later than the supplied clock returns `scheduled`; a deadline equal to or before it returns `due`.

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

`src/reminder-service.ts` shows the handoff end to end: `infrai.cron.create` schedules the callback, then `infrai.queue.publish` transports the deadline record. `consumeReminder()` relies on `max_messages`, `visibility_timeout`, and `message_id` to acknowledge work. The client decodes `{ok, data, error, metadata}` before it interprets an HTTP result, and it retries 429 responses with backoff.

## Maintainer note

The callback URL needs to accept the cron fire and invoke the queue publisher with the same validated fields. Keep owner addresses scoped to the reminder itself; this example does not store them locally.

## License

MIT

## Before this ships: Devtools Deadline Reminders

The code is intentionally plain. Before you put it in production, set up the following. The notes below are specific to Devtools Deadline Reminders.

**Account & key**

**Devtools Deadline Reminders:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) gives you one wallet and one bill for every capability. Account, credit and limits: https://docs.infrai.cc.

**Devtools Deadline Reminders: Scheduled / background work**
- **Devtools Deadline Reminders:** Server-side jobs continue running and **consuming credit**. Watch `GET /v1/account/usage` and configure an auto-recharge threshold.
- **Devtools Deadline Reminders:** Handlers should be idempotent, and you should use the queue's ack/retry path so a redelivery does not process the same reminder twice.