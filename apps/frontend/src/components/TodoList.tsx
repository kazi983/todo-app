import TodoItem from "./TodoItem";
import type { Todo } from "@/types";
import { useState } from "react";

type TodoListProps = {
  todos: Todo[];
  loading: boolean;
  onReorder: (todos: Todo[]) => void;
  onUpdate: (todo: Todo) => void;
};

// Widths of the placeholder rows shown while loading
const SKELETON_WIDTHS = ["w-3/5", "w-1/2", "w-2/3", "w-2/5"];

/**
 * Renders a list of todos fetched from the API.
 * @param {TodoListProps} props - The component props.
 * @param {Todo[]} props.todos - The list of todos to render.
 * @param {boolean} props.loading - Indicates whether the todos are still being fetched.
 * @param {(todos: Todo[]) => void} props.onReorder - Callback that receives the todos in their new order after a drag and drop.
 * @param {(todo: Todo) => void} props.onUpdate - Callback that receives a todo after it was changed.
 * @returns {JSX.Element} The todo list, a loading skeleton, or an empty state.
 */
export default function TodoList({
  todos,
  loading,
  onReorder,
  onUpdate,
}: TodoListProps) {
  // State (not refs) because the dragged row and the drop line are drawn from these values
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  if (loading) {
    return (
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-2xl border border-line bg-white"
      >
        {SKELETON_WIDTHS.map((width) => (
          <div
            key={width}
            className="flex h-15 animate-pulse items-center gap-4 border-t border-divider pr-5 pl-12 first:border-t-0"
          >
            <div className="size-6 shrink-0 rounded-full bg-divider" />
            <div className={`h-3 rounded-full bg-divider ${width}`} />
          </div>
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-field px-8 py-14 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-handle"
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="18" />
          <path d="M16 24.5l5.5 5.5L32 19" />
        </svg>
        <p className="font-display text-[22px] font-bold">A clean slate</p>
        <p className="max-w-75 text-[15px] leading-normal text-muted">
          Type your first task in the box above and press Enter to add it.
        </p>
      </div>
    );
  }

  /**
   * Moves the dragged todo to the position of the todo it was dropped on.
   */
  function handleDragEnd() {
    const from = dragFrom;
    const to = dragOver;

    setDragFrom(null);
    setDragOver(null);

    if (from === null || to === null || from === to) {
      return;
    }

    const reordered = [...todos];
    const fromItem = reordered.splice(from, 1);
    reordered.splice(to, 0, ...fromItem);

    onReorder(reordered);
  }

  return (
    <ul
      aria-label="Todos"
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04),0_8px_24px_rgba(22,24,29,0.05)]"
      onDragOver={(e) => e.preventDefault()}
    >
      {todos.map((todo, index) => {
        // Show a line on the side the dragged todo will land on
        const isDropTarget =
          dragFrom !== null && dragOver === index && dragFrom !== index;

        return (
          <li
            key={todo.id}
            draggable
            className={`relative border-t border-divider first:border-t-0 ${dragFrom === index ? "opacity-45" : ""}`}
            onDragStart={() => {
              setDragFrom(index);
              setDragOver(index);
            }}
            onDragEnter={() => setDragOver(index)}
            onDragEnd={handleDragEnd}
          >
            <TodoItem todo={todo} position={index} onUpdate={onUpdate} />
            {isDropTarget && (
              <div
                className={`absolute inset-x-0 h-0.5 bg-ink ${dragFrom < index ? "bottom-0" : "top-0"}`}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
