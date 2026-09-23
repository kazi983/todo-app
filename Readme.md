# Express Todo Server

This project focuses on building your first Express server with CRUD endpoints to manage a simple todo list. All todos should be stored in server memory (no database yet).

> Please avoid using any external storage or third-party APIs. Keep all data internal to the server process.

## Requirements

1. **Server Setup:**

   - Utilize Express to establish a server.
   - Build with `TypeScript`.
   - Listen on a port of your choice (e.g. `3000`).

2. **Middleware:**

   - Add `express.json()` so the server can parse JSON request bodies.
   - (Optional) Add a simple logger middleware that prints the request method and URL.

3. **In-Memory Data Storage:**

   > As a temporary measure until a database is introduced.

   - Create a constant array to store todos, such as `const todos = [...]`.
   - Each todo should at minimum have an `id`, `title`, and `completed` field.

     ```ts
     // example shape
     { id: 1, title: "Buy groceries", completed: false }
     ```

4. **Implementation of CRUD Routes (GET, POST, PUT, DELETE):**

   Build the following endpoints for the `/todos` resource:

   - `GET /todos` — return the full list of todos.
   - `GET /todos/:id` — return a single todo by id.
   - `POST /todos` — create a new todo from the request body and append it to the array.
   - `PUT /todos/:id` — update an existing todo by id.
   - `DELETE /todos/:id` — remove a todo by id.

5. **Error Handling & Status Codes:**

   - Return `404` when a todo with the given id does not exist.
   - Return `400` when required fields are missing on create/update.
   - Use appropriate success codes (`200`, `201`).
   - Add a catch-all handler for unknown routes.

6. **Submission:**
   - Merge your branch into the `main` branch.

---

**Note:** Ensure thorough error handling and appropriate status codes are incorporated into your server for enhanced robustness. Test each endpoint using a tool like Postman, Thunder Client, or `curl`.
