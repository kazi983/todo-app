import "./index.css";
import TodoList from "./components/TodoList";
import TodoForm from "./components/TodoForm";

/**
 * The main App component for the frontend application.
 * @returns {JSX.Element} The rendered App component.
 */
export function App() {
  return (
    <div className="mx-auto mt-4 max-w-150">
      <TodoForm />
      <TodoList />
    </div>
  );
}

export default App;
