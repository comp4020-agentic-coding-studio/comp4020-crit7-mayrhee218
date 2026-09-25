import type { APIRoute } from "astro";
import { addConsiderationRequest } from "../../lib/db";
import { bus } from "../../lib/events";

// The write half of the persisted flow: a plain HTML form POSTs here, the
// request goes into SQLite, and the new row is broadcast to every open SSE
// connection. The 303 redirect makes the form work with no client-side
// JavaScript at all — the submitting tab re-renders from the database; every
// *other* tab hears about it over the stream.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseCode = String(form.get("courseCode") ?? "").trim();
  const reason = String(form.get("reason") ?? "").trim();
  if (courseCode && reason) {
    bus.emit("consideration-request", addConsiderationRequest(courseCode.slice(0, 20), reason.slice(0, 500)));
  }
  return redirect("/special-consideration/", 303);
};
