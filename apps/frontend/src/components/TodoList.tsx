import TodoItem from "./TodoItem";
import type { Todo } from "@/types";
import { useRef } from "react";

type TodoListProps = {
  todos: Todo[];
  loading: boolean;
  onReorder: (todos: Todo[]) => void;
};
/**
 * Renders a list of todos fetched from the API.
 * @param {TodoListProps} props - The component props.
 * @param {Todo[]} props.todos - The list of todos to render.
 * @param {boolean} props.loading - Indicates whether the todos are still being fetched.
 * @param {(todos: Todo[]) => void} props.onReorder - Callback that receives the todos in their new order after a drag and drop.
 * @returns {JSX.Element} The todo list or a loading message.
 */
export default function TodoList({ todos, loading, onReorder }: TodoListProps) {
  // useRef: does not trigger a re-render unlike uesState.
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  if (loading) {
    return <p>Loading...</p>;
  }

  /**
   * Moves the dragged todo to the position of the todo it was dropped on.
   */
  function handleDragEnd() {
    const from = dragItem.current;
    const to = dragOverItem.current;

    dragItem.current = null;
    dragOverItem.current = null;

    if (from === null || to === null || from === to) {
      return;
    }

    const reordered = [...todos];
    const fromItem = reordered.splice(from, 1);
    reordered.splice(to, 0, ...fromItem);

    onReorder(reordered);
  }

  return (
    <ul className="space-y-2" onDragOver={(e) => e.preventDefault()}>
      {todos.map((todo, index) => (
        <li
          key={todo.id}
          draggable
          className="cursor-grab"
          onDragStart={() => (dragItem.current = index)}
          onDragEnter={() => (dragOverItem.current = index)}
          onDragEnd={handleDragEnd}
        >
          <TodoItem todo={todo} />
        </li>
      ))}
    </ul>
  );
}
