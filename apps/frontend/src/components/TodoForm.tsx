import type { Todo } from "@/types";
import { useState } from "react";

type TodoFormProps = {
  onAdd: (todo: Todo) => void;
};

/**
 * Renders a form for creating a new todo.
 * @param {TodoFormProps} props - The component props.
 * @param {(todo: Todo) => void} props.onAdd - Callback function to add a new todo to the list.
 * @returns {JSX.Element} The todo creation form.
 */
export default function TodoForm({ onAdd }: TodoFormProps) {
  const [value, setValue] = useState<string>("");

  /**
   * Create a new todo by sending a POST request to the API.
   * @param {React.SyntheticEvent<HTMLFormElement>} e - The form submission event.
   */
  function createTodo(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    const body = {
      title: value,
    };

    fetch(`/api/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to save todos: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        onAdd(data);
      })
      .catch((err) => {
        // TODO: error message
      });

    setValue("");
  }

  /**
   * Updates the todo title input value
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
   */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
  }

  return (
    <form onSubmit={createTodo} className="flex gap-4 pb-5">
      <input
        type="text"
        name="title"
        id="title"
        value={value}
        onChange={handleChange}
        className="px-4 py-2 border border-slate-300 w-full"
      />
      <button type="submit" className="bg-blue-200 px-3 py-1 cursor-pointer">
        ADD
      </button>
    </form>
  );
}
