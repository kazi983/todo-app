import { useState } from "react";
import toast from "react-hot-toast";
import type { Todo } from "@/types";

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
  const isEmpty = value.trim() === "";

  /**
   * Create a new todo by sending a POST request to the API.
   * @param {React.SyntheticEvent<HTMLFormElement>} e - The form submission event.
   */
  function createTodo(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    // Enter still submits the form even though the button is disabled
    if (isEmpty) return;

    const body = {
      title: value.trim(),
    };

    fetch(`/api/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(`${body.error}: ${res.status}`);
        return body;
      })
      .then((data) => {
        onAdd(data);
      })
      .catch((err) => {
        toast.error(`Couldn't add the task. (${err.message})`);
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
    <form onSubmit={createTodo} className="flex gap-2 sm:gap-3">
      <label htmlFor="title" className="sr-only">
        New task
      </label>
      <div className="flex flex-1 items-center gap-3 bg-white px-4 sm:px-5 border border-field focus-within:border-ink rounded-xl min-w-0 h-13 sm:h-14">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="hidden sm:block text-done shrink-0"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <input
          type="text"
          name="title"
          id="title"
          value={value}
          onChange={handleChange}
          placeholder="Add a task and press Enter"
          autoComplete="off"
          className="flex-1 bg-transparent outline-none min-w-0 h-full sm:text-[17px] placeholder:text-done text-base"
        />
      </div>
      {/* Mobile shows a "+" icon; wider screens show the "Add" label */}
      <button
        type="submit"
        disabled={isEmpty}
        className="flex justify-center items-center bg-ink disabled:opacity-35 sm:px-7 rounded-xl sm:w-auto sm:h-14 size-13 font-semibold text-white cursor-pointer disabled:cursor-not-allowed shrink-0"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="sm:hidden"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="sr-only sm:not-sr-only">Add</span>
      </button>
    </form>
  );
}
