import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

// ==========================================================================
// Types
// ==========================================================================

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

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
    res.status(404).json({ error: "Todo not found.", message });
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
  app.get("/todos/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const todo = todos.find((todo) => todo.id === Number(id));

    if (!todo) {
      send404(res, `ID "${id}" does not exist.`);
      return;
    }

    res.status(200).json(todo);
  });

  // POST /todos
  app.post("/todos", (req: Request, res: Response) => {
    const body = req.body ?? {};

    let completed = false;

    if (
      !("title" in body) ||
      typeof body.title !== "string" ||
      body.title.trim() === ""
    ) {
      res.status(400).json({
        error: "Required field is missing: title.",
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
  app.put("/todos/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const todo = todos.find((todo) => todo.id === id);

    if (!todo) {
      send404(res, `ID "${id}" does not exist.`);
      return;
    }

    const body = req.body ?? {};

    const missingFields = [];

    if (!("title" in body)) {
      missingFields.push("title");
    }
    if (!("completed" in body)) {
      missingFields.push("completed");
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        error: `Required field is missing: ${missingFields.join(", ")}.`,
      });
      return;
    }

    todo.title = body.title;
    todo.completed = body.completed;

    res.status(200).json(todo);
  });

  // DELETE /todos/:id
  app.delete("/todos/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!todos.some((todo) => todo.id === id)) {
      send404(res, `ID "${id}" does not exist.`);
      return;
    }

    const index = todos.findIndex((todo) => todo.id === id)!;
    todos.splice(index, 1);

    // Automatically set to the default HTTP status message
    res.sendStatus(204);
  });

  // Handle requests to undefined routes.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Invalid URL." });
  });

  return app;
}
