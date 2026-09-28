import toast from "react-hot-toast";
import type { Todo } from "@/types";

type TodoProps = {
  todo: Todo;
  position: number;
  onUpdate: (todo: Todo) => void;
};

// Colors for the top rows of the list, by position.
// Full class names are written out so Tailwind can find them in the source.
const PRIORITY_STYLES = [
  { row: "bg-priority-1/12", ring: "border-priority-1" },
  { row: "bg-priority-2/12", ring: "border-priority-2" },
];

/**
 * Renders a todo item.
 * @param {TodoProps} props - The component props.
 * @param {Todo} props.todo - The todo to render.
 * @param {number} props.position - The index of the todo in the list, used to pick its priority color.
 * @param {(todo: Todo) => void} props.onUpdate - Callback that receives the todo returned by the API after a change.
 * @returns {JSX.Element} The todo item.
 */
export default function TodoItem({ todo, position, onUpdate }: TodoProps) {
  // Completed todos lose their priority color
  const priority = todo.completed ? undefined : PRIORITY_STYLES[position];

  /**
   * Toggles the completion status of a todo.
   */
  function toggleComplete() {
    const body = { title: todo.title, completed: !todo.completed };

    fetch(`/api/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to toggle complete status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        onUpdate(data);
      })
      .catch((err) => {
        toast.error(`Couldn't update this task. (${err.message})`);
      });
  }

  return (
    <div
      className={`flex items-center gap-1 pr-4 pl-2 transition-colors ${priority?.row ?? ""}`}
    >
      {/* touch-none: dragging the handle moves the task instead of scrolling the page */}
      <span
        data-drag-handle
        title="Drag to reorder"
        className="flex justify-center items-center w-11 sm:w-8 h-15 text-handle cursor-grab touch-none shrink-0"
      >
        <svg
          width="12"
          height="18"
          viewBox="0 0 12 18"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="9" cy="3" r="1.5" />
          <circle cx="3" cy="9" r="1.5" />
          <circle cx="9" cy="9" r="1.5" />
          <circle cx="3" cy="15" r="1.5" />
          <circle cx="9" cy="15" r="1.5" />
        </svg>
      </span>
      <button
        type="button"
        onClick={toggleComplete}
        aria-pressed={todo.completed}
        className="flex flex-1 items-center gap-4 min-h-15 text-left cursor-pointer"
      >
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors
             ${
               todo.completed
                 ? "border-done bg-done"
                 : (priority?.ring ?? "border-ring")
             }
            `}
        >
          {todo.completed && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
        </span>
        <span
          className={`text-base leading-snug transition-colors sm:text-[17px] ${
            todo.completed
              ? "text-done-text line-through decoration-handle"
              : priority
                ? "font-medium"
                : ""
          }`}
        >
          {todo.title}
        </span>
      </button>
    </div>
  );
}
