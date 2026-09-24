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
let latestId = 0;

// ==========================================================================
// Test data
// ==========================================================================

todos.push({ id: ++latestId, title: "Buy groceries", completed: false });
todos.push({ id: ++latestId, title: "Buy groceries", completed: false });
todos.push({ id: ++latestId, title: "Buy groceries", completed: false });
todos.push({ id: ++latestId, title: "Buy groceries", completed: false });

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
app.get("/todos", (_req: Request, res: Response) => {
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

  let completed = false;

  if (!("title" in body)) {
    res.status(400).json({
      error: "Required field is missing: title",
    });
    return;
  }
  if ("completed" in body) {
    completed = body.completed;
  }

  const newTodo = { id: ++latestId, title: body.title, completed };

  todos.push(newTodo);

  res.status(201).json(newTodo);
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

  res.status(200).json(todo);
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

  res.sendStatus(204);
});

// Handle requests to undefined routes.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Invalid URL" });
});

app.listen(PORT, () => {
  console.log(`app running on port: ${PORT}`);
});
