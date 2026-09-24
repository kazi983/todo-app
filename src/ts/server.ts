import express, { type Express, type Request, type Response } from "express";
import type { NextFunction } from "express-serve-static-core";
import { todo } from "node:test";

// ==========================================================================
// Middleware
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

// ==========================================================================
// Function
// ==========================================================================

function reqLogger(req: Request, res: Response, next: NextFunction) {
  console.log(`${req.method}: ${req.url}`);
  next();
}

function send404page(req: Request, res: Response) {
  res.status(404).json({ error: "Invalid URL" });
}

// ==========================================================================
// Parse
// ==========================================================================

// To load the middleware function, call app.use(),
// specifying the middleware function.
// The following code loads the express.json() middleware function before the route to the root path (/).
// https://expressjs.com/en/resources/middleware/body-parser/ ??
app.use(express.json());

app.use(reqLogger);

// GET /todos
app.get("/todos", (req: Request, res: Response) => {
  res.status(200).json(todos);
});

// GET /todos/:id
app.get("/todos/{:id}", (req: Request, res: Response) => {
  const id = req.params.id;

  if (!todos.some((todo) => todo.id === Number(id))) {
    send404page(req, res);
    return;
  }

  const todo = todos.find((todo) => todo.id === Number(id));

  res.status(200).json(todo);
});

// POST /todos
app.post("/todos", (req: Request, res: Response) => {
  // TODO
  // res.status(200).json({ message: "A todo created" });
});

// PUT /todos/:id
app.put("/todos/{:id}", (req: Request, res: Response) => {
  const id = req.params.id;

  if (!todos.some((todo) => todo.id === Number(id))) {
    send404page(req, res);
    return;
  }

  // TODO
  // res.status(200).json({ message: "A todo updated" });
});

// DELETE /todos/:id
app.delete("/todos/{:id}", (req: Request, res: Response) => {
  const id = req.params.id;

  if (!todos.some((todo) => todo.id === Number(id))) {
    send404page(req, res);
    return;
  }

  // TODO
  // res.status(200).json({ message: "A todo removed" });
});

// Invalid URL
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Invalid URL" });
});

app.listen(PORT, () => {
  console.log(`app running on port: ${PORT}`);
});
