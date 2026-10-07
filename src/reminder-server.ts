import { createServer } from "node:http";
import { scheduleReminder } from "./reminder-service";

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/reminders") { response.writeHead(404).end(); return; }
  let raw = "";
  for await (const chunk of request) raw += chunk;
  try {
    const result = await scheduleReminder(JSON.parse(raw));
    response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof SyntaxError || (error as { name?: string }).name === "ZodError" ? 400 : 502;
    response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "request failed" }));
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("reminder service listening"));
