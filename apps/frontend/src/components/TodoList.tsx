import TodoItem from "./TodoItem";
import type { Todo } from "@/types";

type TodoListProps = {
  todos: Todo[];
  loading: boolean;
};
/**
 * Renders a list of todos fetched from the API.
 * @param {TodoListProps} props - The component props.
 * @param {Todo[]} props.todos - The list of todos to render.
 * @param {boolean} props.loading - Indicates whether the todos are still being fetched.
 * @returns {JSX.Element} The todo list or a loading message.
 */
export default function TodoList({ todos, loading }: TodoListProps) {
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
