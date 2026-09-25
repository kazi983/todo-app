import { beforeAll, afterAll, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";

import { createApp, type Todo } from "./app.ts";

const MISSING_ID = 99999;

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  // Port 0 lets the OS pick a free port, so tests never collide with a running dev server.
  server = createApp().listen(0);
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;
});

afterAll(async () => {
  // Drop keep-alive connections first, otherwise close() waits for them.
  server.closeAllConnections();
  server.close();
  await once(server, "close");
});

/**
 * Sends a request to the test server, encoding the body as JSON when given.
 * @param {string} method - HTTP method, e.g. "GET".
 * @param {string} path - Request path, e.g. "/todos/1".
 * @param {unknown} [body] - Optional value sent as a JSON body.
 * @returns {Promise<Response>} The raw fetch response.
 */
function request(
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/**
 * Creates a todo through the API and returns it.
 * @param {Partial<Todo>} input - Fields sent in the POST body.
 * @returns {Promise<Todo>} The todo created by the server.
 */
async function createTodo(input: Partial<Todo>): Promise<Todo> {
  const res = await request("POST", "/todos", input);
  expect(res.status).toBe(201);
  return (await res.json()) as Todo;
}

describe("GET /todos", () => {
  test("GET /todos: returns 200 with a JSON array", async () => {
    const res = await request("GET", "/todos");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("includes todos that were created", async () => {
    const a = await createTodo({ title: "Buy milk" });
    const b = await createTodo({ title: "Walk the dog" });

    const todos = (await (await request("GET", "/todos")).json()) as Todo[];

    expect(todos).toContainEqual(a);
    expect(todos).toContainEqual(b);
  });
});

describe("GET /todos/:id", () => {
  test("returns 200 with the matching todo", async () => {
    const created = await createTodo({ title: "Vacume" });

    const res = await request("GET", `/todos/${created.id}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(created);
  });

  test("returns 404 when the todo does not exist", async () => {
    const res = await request("GET", `/todos/${MISSING_ID}`);

    expect(res.status).toBe(404);
  });

  test("returns 400 or 404 for a non-numeric id", async () => {
    const res = await request("GET", "/todos/test");

    // Both are defensible: 400 (malformed id) or 404 (no such todo).
    expect([400, 404]).toContain(res.status);
  });
});

describe("POST /todos", () => {
  test("returns 201 with the created todo", async () => {
    const res = await request("POST", "/todos", { title: "Buy groceries" });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: expect.any(Number),
      title: "Buy groceries",
      completed: false, // defaults to false when omitted
    });
  });

  test("keeps completed when it is provided", async () => {
    const todo = await createTodo({ title: "Already done", completed: true });

    expect(todo.completed).toBe(true);
  });

  test("assigns a unique id to each todo", async () => {
    const a = await createTodo({ title: "First" });
    const b = await createTodo({ title: "Second" });

    expect(a.id).not.toBe(b.id);
  });

  test("stores the todo so it can be fetched afterwards", async () => {
    const created = await createTodo({ title: "Persist me" });

    const res = await request("GET", `/todos/${created.id}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(created);
  });

  test("returns 400 when title is missing", async () => {
    const res = await request("POST", "/todos", { completed: false });

    expect(res.status).toBe(400);
  });

  test("returns 400 when the body is empty", async () => {
    const res = await request("POST", "/todos");

    expect(res.status).toBe(400);
  });

  test("returns 400 when title is an empty string", async () => {
    const res = await request("POST", "/todos", { title: "" });

    expect(res.status).toBe(400);
  });

  test("returns 400 when title is not a string", async () => {
    const res = await request("POST", "/todos", { title: 123 });

    expect(res.status).toBe(400);
  });

  test("does not store a todo when validation fails", async () => {
    const before = (await (await request("GET", "/todos")).json()) as Todo[];
    await request("POST", "/todos", {});
    const after = (await (await request("GET", "/todos")).json()) as Todo[];

    expect(after).toHaveLength(before.length);
  });
});

describe("PUT /todos/:id", () => {
  test("returns 200 with the updated todo", async () => {
    const created = await createTodo({ title: "Old title" });

    const res = await request("PUT", `/todos/${created.id}`, {
      title: "New title",
      completed: true,
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: created.id,
      title: "New title",
      completed: true,
    });
  });

  test("persists the update", async () => {
    const created = await createTodo({ title: "Old title" });
    await request("PUT", `/todos/${created.id}`, {
      title: "New title",
      completed: true,
    });

    const res = await request("GET", `/todos/${created.id}`);

    expect(await res.json()).toEqual({
      id: created.id,
      title: "New title",
      completed: true,
    });
  });

  test("returns 404 when the todo does not exist", async () => {
    const res = await request("PUT", `/todos/${MISSING_ID}`, {
      title: "x",
      completed: false,
    });

    expect(res.status).toBe(404);
  });

  test("returns 400 when title is missing", async () => {
    const created = await createTodo({ title: "Keep me" });

    const res = await request("PUT", `/todos/${created.id}`, {
      completed: true,
    });

    expect(res.status).toBe(400);
  });

  test("returns 400 when completed is missing", async () => {
    const created = await createTodo({ title: "Keep me" });

    const res = await request("PUT", `/todos/${created.id}`, {
      title: "New title",
    });

    expect(res.status).toBe(400);
  });

  test("leaves the todo unchanged when validation fails", async () => {
    const created = await createTodo({ title: "Keep me" });
    await request("PUT", `/todos/${created.id}`, { completed: true });

    const res = await request("GET", `/todos/${created.id}`);

    expect(await res.json()).toEqual(created);
  });
});

describe("DELETE /todos/:id", () => {
  test("returns a success status", async () => {
    const created = await createTodo({ title: "Delete me" });

    const res = await request("DELETE", `/todos/${created.id}`);

    // 200 (with the deleted todo) and 204 (no content) are both common choices.
    expect([200, 204]).toContain(res.status);
  });

  test("removes the todo from the list", async () => {
    const created = await createTodo({ title: "Delete me" });
    await request("DELETE", `/todos/${created.id}`);

    const single = await request("GET", `/todos/${created.id}`);
    const all = (await (await request("GET", "/todos")).json()) as Todo[];

    expect(single.status).toBe(404);
    expect(all).not.toContainEqual(created);
  });

  test("returns 404 when the todo does not exist", async () => {
    const res = await request("DELETE", `/todos/${MISSING_ID}`);

    expect(res.status).toBe(404);
  });

  test("returns 404 when deleting the same todo twice", async () => {
    const created = await createTodo({ title: "Delete me" });
    await request("DELETE", `/todos/${created.id}`);

    const res = await request("DELETE", `/todos/${created.id}`);

    expect(res.status).toBe(404);
  });
});

describe("unknown routes", () => {
  test("returns 404 for an unknown path", async () => {
    const res = await request("GET", "/does-not-exist");

    expect(res.status).toBe(404);
  });

  test("returns 404 for an unsupported method on a known path", async () => {
    const res = await request("PATCH", "/todos");

    expect(res.status).toBe(404);
  });
});
