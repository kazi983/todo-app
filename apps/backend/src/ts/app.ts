import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import * as fs from "fs";
import * as path from "path";

import type { Todo } from "./types.ts";

const DATA_FILE = path.join(import.meta.dirname, "../../data/todos.json");

/**
 * Creates and configures an Express application with routes for managing todos.
 * @returns {Express} The configured Express application.
 */
export function createApp() {
  // ==========================================================================
  // Express app
  // ==========================================================================

  const app: Express = express();

  // ==========================================================================
  // Constants
  // ==========================================================================

  const todos: Todo[] = [];
  let latestId = 0;
  fs.readFile(DATA_FILE, "utf-8", (err, data) => {
    if (err?.code !== "ENOENT" && data) {
      todos.push(...(JSON.parse(data) as Todo[]));
      latestId = Math.max(0, ...todos.map((todo) => todo.id));
    }
  });

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
    res.status(404).json({ error: "Todo not found", message });
  }

  // ==========================================================================
  // Register middleware
  // ==========================================================================

  // Register express.json() middleware to parse incoming JSON request bodies.
  // QUESTION: https://expressjs.com/en/resources/middleware/body-parser/
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
  app.get("/todos/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const todo = todos.find((todo) => todo.id === id);

    if (!todo) {
      send404(res, `ID "${id}" does not exist`);
      return;
    }

    res.status(200).json(todo);
  });

  // POST /todos
  app.post("/todos", (req: Request, res: Response) => {
    const body = req.body ?? {};

    let completed = false;

    if (typeof body.title !== "string" || body.title.trim() === "") {
      res.status(400).json({
        error: "Missing field: title",
      });
      return;
    }

    if (typeof body.completed !== "boolean") {
      res.status(400).json({
        error: "Invalid field: completed",
      });
      return;
    }

    if ("completed" in body) {
      completed = body.completed;
    }

    const newTodo = { id: ++latestId, title: body.title, completed };

    todos.push(newTodo);

    fs.writeFile(DATA_FILE, JSON.stringify(todos), "utf8", (err) => {
      if (err) {
        todos.pop();
        res.status(500).json({ error: "Error writing file" });
        return;
      }
      res.status(201).json(newTodo);
    });
  });

  // PUT /todos/order
  app.put("/todos/order", (req: Request, res: Response) => {
    const orderedIds = (req.body ?? {}).ids;
    const oldTodos = [...todos];

    const isValid =
      Array.isArray(orderedIds) &&
      orderedIds.length === todos.length &&
      new Set(orderedIds).size === orderedIds.length &&
      orderedIds.every((id) => todos.some((todo) => todo.id === id));

    if (!isValid) {
      res.status(400).json({
        error: "Invalid field: ids must contain every todo id exactly once",
      });
      return;
    }

    todos.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));

    fs.writeFile(DATA_FILE, JSON.stringify(todos), "utf8", (err) => {
      if (err) {
        todos.splice(0, todos.length, ...oldTodos);
        res.status(500).json({ error: "Error writing file" });
        return;
      }
      res.status(200).json(todos);
    });
  });

  // PUT /todos/:id
  app.put("/todos/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const todo = todos.find((todo) => todo.id === id);

    if (!todo) {
      send404(res, `ID "${id}" does not exist`);
      return;
    }

    const body = req.body ?? {};

    const invalidFields = [];

    if (typeof body.title !== "string" || body.title.trim() === "") {
      invalidFields.push("title");
    }
    if (typeof body.completed !== "boolean") {
      invalidFields.push("completed");
    }

    if (invalidFields.length > 0) {
      res.status(400).json({
        error: `Invalid or missing field(s): ${invalidFields.join(", ")}`,
      });
      return;
    }

    const prev = { ...todo };
    todo.title = body.title;
    todo.completed = Boolean(body.completed);

    fs.writeFile(DATA_FILE, JSON.stringify(todos), "utf8", (err) => {
      if (err) {
        todo.title = prev.title;
        todo.completed = prev.completed;
        res.status(500).json({ error: "Error writing file" });
        return;
      }
      res.status(200).json(todo);
    });
  });

  // DELETE /todos/:id
  app.delete("/todos/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const index = todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      send404(res, `ID "${id}" does not exist`);
      return;
    }

    const [removed] = todos.splice(index, 1);

    fs.writeFile(DATA_FILE, JSON.stringify(todos), "utf8", (err) => {
      if (err) {
        todos.splice(index, 0, removed);
        res.status(500).json({ error: "Error writing file" });
        return;
      }
      // Automatically set to the default HTTP status message
      res.sendStatus(204);
    });
  });

  // Handle requests to undefined routes.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Invalid URL" });
  });

  return app;
}
