import { useState, useEffect } from "react";
import type { Todo } from "@/types";

type TodoProps = {
  todo: Todo;
};

/**
 * Renders a todo item.
 * @param {TodoProps} todo - The todo to render.
 * @returns {JSX.Element} The todo item.
 */
export default function TodoItem({ todo }: TodoProps) {
  const [completed, setCompleted] = useState<boolean>(todo.completed);

  /**
   * Toggles the completion status of a todo.
   */
  function toggleComplete() {
    const body = { title: todo.title, completed: !completed };

    fetch(`/api/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        setCompleted(data.completed);
        todo.completed = completed;
      })
      .catch((err) => {
        // TODO: error message
      });
  }

  return (
    <div
      className={`shadow px-4 py-2 round-sm delay-100 cursor-pointer ${completed ? "bg-slate-400 text-slate-300" : "bg-slate-100"}`}
      onClick={toggleComplete}
    >
      <div
        className={`delay-100 ${completed ? "line-through decoration-slite-300" : ""}`}
      >
        {todo.title}
      </div>
    </div>
  );
}
