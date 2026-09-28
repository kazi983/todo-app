import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import "./index.css";
import TodoList from "./components/TodoList";
import TodoForm from "./components/TodoForm";
import type { Todo } from "@/types";

/**
 * The main App component for the frontend application.
 * @returns {JSX.Element} The rendered App component.
 */
export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/todos", { method: "GET", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch todos: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTodos(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // Ignore requests cancelled by cleanup
        setLoading(false);
        toast.error(`Couldn't load your tasks. (${err.message})`);
      });
    // QUESTION: prevent "pseudo-mounting"?
    return () => controller.abort(); // Cancel the in-flight request on unmount
  }, []);

  /**
   * Appends a newly created todo to the list.
   * @param {Todo} todo - The todo returned by the API.
   */
  function addTodo(todo: Todo) {
    setTodos((prev) => [...prev, todo]);
  }

  /**
   * Replaces a todo with the version returned by the API.
   * @param {Todo} updated - The updated todo.
   */
  function updateTodo(updated: Todo) {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === updated.id ? updated : todo)),
    );
  }

  /**
   * Shows the new order immediately and saves it to the API.
   * Rolls back to the previous order if saving fails.
   * @param {Todo[]} reordered - The todos in their new order.
   */
  function reorderTodos(reordered: Todo[]) {
    // Make a backup for a roll back
    const previous = todos;

    setTodos(reordered);

    fetch("/api/todos/order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((todo) => todo.id) }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to save order: ${res.status}`);
      })
      .catch((err) => {
        setTodos(previous);
        toast.error(
          `Couldn't save the new order. Your list was put back. (${err.message})`,
        );
      });
  }

  const total = todos.length;
  const done = todos.filter((todo) => todo.completed).length;

  return (
    <main className="mx-auto flex max-w-160 flex-col gap-6 px-5 pt-14 pb-16 sm:gap-8 sm:pt-22">
      <Toaster
        toastOptions={{
          style: {
            background: "#16181d",
            color: "#ffffff",
            borderRadius: "12px",
            fontSize: "14px",
          },
          error: { iconTheme: { primary: "#ff6b8a", secondary: "#16181d" } },
        }}
      />
      <header className="flex flex-col gap-3 sm:gap-4">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase sm:text-[13px]">
          Todo App
        </p>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1 className="font-display text-[38px] leading-none font-bold tracking-tight sm:text-[56px]">
            What needs doing
          </h1>
          <p role="status" className="pb-1 text-sm text-muted sm:text-[15px]">
            {loading ? (
              "Loading your tasks…"
            ) : total === 0 ? (
              "No tasks yet"
            ) : (
              <>
                <span className="font-semibold text-ink">{done}</span> of{" "}
                {total} done
              </>
            )}
          </p>
        </div>
        {total > 0 && (
          <div
            aria-hidden="true"
            className="h-1 overflow-hidden rounded-full bg-line"
          >
            <div
              className="h-1 rounded-full bg-ink transition-[width] duration-300"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        )}
      </header>
      <TodoForm onAdd={addTodo} />
      <TodoList
        todos={todos}
        loading={loading}
        onReorder={reorderTodos}
        onUpdate={updateTodo}
      />
      {total > 0 && (
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] text-muted">
          <span>Click a task to mark it done</span>
          <span aria-hidden="true">·</span>
          <span>Drag a task to reorder</span>
        </p>
      )}
    </main>
  );
}

export default App;
