import express, { type Express, type Request, type Response } from "express";
import type { NextFunction } from "express-serve-static-core";

// ==========================================================================
// Express app
// ==========================================================================

const app: Express = express();

// ==========================================================================
// Types
// ==========================================================================

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

// ==========================================================================
// Constants
// ==========================================================================

const PORT = 3000;
const todos: Todo[] = [];

// ==========================================================================
// Test data
// ==========================================================================

todos.push({ id: 1, title: "Buy groceries", completed: false });
todos.push({ id: 2, title: "Buy groceries", completed: false });
todos.push({ id: 3, title: "Buy groceries", completed: false });
todos.push({ id: 4, title: "Buy groceries", completed: false });

// ==========================================================================
// Utility functions
// ==========================================================================

/**
 * Logs the HTTP request method and URL before passing control to the next middleware.
 * @param {Request} req - The HTTP request.
 * @param {Response} res - The HTTP response.
 * @param {NextFunction} next - The function that passes control to the next middleware.
 */
function reqLogger(req: Request, res: Response, next: NextFunction) {
  console.log(`${req.method}: ${req.url}`);
  next();
}

/**
 * Sends a 404 response with an optional error message.
 * @param {Response} res - The HTTP response.
 * @param {string} message - An optional error message.
 */
function send404(res: Response, message: string = "") {
  res.status(404).json({ error: "Invalid URL", message });
}

// ==========================================================================
// Register middleware
// ==========================================================================

// Register express.json() middleware to parse incoming JSON request bodies.
//  https://expressjs.com/en/resources/middleware/body-parser/ ??
app.use(express.json());

app.use(reqLogger);

// ==========================================================================
// Routes
// ==========================================================================

// GET /todos
app.get("/todos", (res: Response) => {
  res.status(200).json(todos);
});

// GET /todos/:id
app.get("/todos/{:id}", (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!todos.some((todo) => todo.id === id)) {
    send404(res, `ID "${id}" does not exist`);
    return;
  }

  const todo = todos.find((todo) => todo.id === Number(id));

  res.status(200).json(todo);
});

// POST /todos
app.post("/todos", (req: Request, res: Response) => {
  const body = req.body;

  const missingFields: String[] = [];

  if (!("id" in body)) {
    missingFields.push("id");
  }
  if (!("title" in body)) {
    missingFields.push("title");
  }
  if (!("completed" in body)) {
    missingFields.push("completed");
  }

  if (missingFields.length > 1) {
    res.status(400).json({
      error: `Required fields are missing: ${missingFields.slice(0, missingFields.length - 1).join(", ")} and ${missingFields[missingFields.length - 1]}`,
    });
    return;
  } else if (missingFields.length > 0) {
    res.status(400).json({
      error: `Required field is missing: ${missingFields[0]}`,
    });
    return;
  }

  todos.push({ id: body.id, title: body.title, completed: body.completed });

  res.status(200).json({ message: "A todo created", todos });
});

// PUT /todos/:id
app.put("/todos/{:id}", (req: Request, res: Response) => {
  const id: Number = Number(req.params.id);

  if (!todos.some((todo) => todo.id === id)) {
    send404(res, `ID "${id}" does not exist`);
    return;
  }

  const body = req.body;

  if (Object.keys(body).length === 0) {
    res.status(400).json({
      error: "At least one field must be provided in the request body",
    });
    return;
  }

  const todo = todos.find((todo) => todo.id === id)!;

  if ("title" in body) {
    todo.title = body.title;
  }

  if ("completed" in body) {
    todo.completed = body.completed;
  }

  res.status(200).json({ message: "A todo updated", todo });
});

// DELETE /todos/:id
app.delete("/todos/{:id}", (req: Request, res: Response) => {
  const id: Number = Number(req.params.id);

  if (!todos.some((todo) => todo.id === id)) {
    send404(res, `ID "${id}" does not exist`);
    return;
  }

  const index = todos.findIndex((todo) => todo.id === id)!;
  todos.splice(index, 1);

  res.status(200).json({ message: "A todo removed", todos });
});

// Handle requests to undefined routes.
app.use((res: Response) => {
  res.status(404).json({ error: "Invalid URL" });
});

app.listen(PORT, () => {
  console.log(`app running on port: ${PORT}`);
});
