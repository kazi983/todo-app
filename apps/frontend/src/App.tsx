import { useState, useEffect } from "react";
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
      .then((res) => res.json())
      .then((data) => {
        setTodos(data);
        setLoading(false);
      })
      .catch((err) => {
        // TODO: error message
        if (err.name === "AbortError") return; // Ignore requests cancelled by cleanup
        setLoading(false);
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
      .catch(() => {
        // TODO: error message
        setTodos(previous);
      });
  }

  return (
    <div className="mx-auto mt-4 px-5 max-w-150">
      <TodoForm onAdd={addTodo} />
      <TodoList todos={todos} loading={loading} onReorder={reorderTodos} />
    </div>
  );
}

export default App;
