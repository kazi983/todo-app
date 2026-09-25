import { useState, useEffect } from "react";
import TodoItem from "./TodoItem";
import type { Todo } from "@/types";

/**
 * Renders a list of todos fetched from the API.
 * @returns {JSX.Element} The todo list or a loading message.
 */
export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/todos", { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        setTodos(data);
        setLoading(false);
      })
      .catch((err) => {
        // TODO: error message
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoItem todo={todo} />
        </li>
      ))}
    </ul>
  );
}
