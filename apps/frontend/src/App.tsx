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

  return (
    <div className="mx-auto mt-4 px-5 max-w-150">
      <TodoForm onAdd={addTodo} />
      <TodoList todos={todos} loading={loading} onReorder={setTodos} />
    </div>
  );
}

export default App;
