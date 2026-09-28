import TodoItem from "./TodoItem";
import type { Todo } from "@/types";
import { useEffect, useRef, useState } from "react";

type TodoListProps = {
  todos: Todo[];
  loading: boolean;
  onReorder: (todos: Todo[]) => void;
  onUpdate: (todo: Todo) => void;
};

// Widths of the placeholder rows shown while loading
const SKELETON_WIDTHS = ["w-3/5", "w-1/2", "w-2/3", "w-2/5"];

// Mouse: how far (px) the pointer must move on a row before a drag starts
const MOUSE_DRAG_DISTANCE = 5;
// Touch and pen: how long (ms) a row must be pressed before a drag starts
const LONG_PRESS_DELAY = 300;
// Touch and pen: how far (px) the finger may drift during the long-press
const LONG_PRESS_TOLERANCE = 10;
// While dragging: the page scrolls when the pointer is this close (px) to the top or bottom of the window
const AUTO_SCROLL_EDGE = 80;
// While dragging: the fastest auto-scroll speed (px per frame), reached at the very edge
const AUTO_SCROLL_MAX_SPEED = 16;

// A press on a row that may still turn into a drag
type PendingPress = { index: number; x: number; y: number; timer?: number };

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
  // Refs because they do not change what is drawn
  const pendingPress = useRef<PendingPress | null>(null);
  const justDragged = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // While dragging, stop the page from scrolling under the finger.
  // React's onTouchMove is passive, so preventDefault() only works on a native listener.
  useEffect(() => {
    if (dragFrom === null) return;

    // Create a function that calls preventDefault() and stop scrolling on mobile
    const preventScroll = (e: TouchEvent) => e.preventDefault();

    // touchmove listeners on document are passive by default, which ignores preventDefault(),
    // so set passive: false explicitly
    document.addEventListener("touchmove", preventScroll, { passive: false });

    // Prepare the function run the next time
    return () => document.removeEventListener("touchmove", preventScroll);
  }, [dragFrom]);

  // While dragging, scroll the page when the pointer is near the top or bottom of the window.
  // A frame loop is needed because a pointer held still at the edge fires no pointermove.
  useEffect(() => {
    if (dragFrom === null) return;

    let frame = 0;
    const step = () => {
      const { x, y } = lastPointer.current;
      const bottomEdge = window.innerHeight - AUTO_SCROLL_EDGE;

      // Negative scrolls up, positive scrolls down; faster the closer to the edge
      let speed = 0;
      if (y < AUTO_SCROLL_EDGE) {
        speed =
          -((AUTO_SCROLL_EDGE - y) / AUTO_SCROLL_EDGE) * AUTO_SCROLL_MAX_SPEED;
      } else if (y > bottomEdge) {
        speed = ((y - bottomEdge) / AUTO_SCROLL_EDGE) * AUTO_SCROLL_MAX_SPEED;
      }

      if (speed !== 0) {
        window.scrollBy(0, speed);
        // The rows moved under the pointer, so check again which row it is over
        updateDragOver(x, y);
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [dragFrom]);

  if (loading) {
    return (
      <div
        aria-hidden="true"
        className="bg-white border border-line rounded-2xl overflow-hidden"
      >
        {SKELETON_WIDTHS.map((width) => (
          <div
            key={width}
            className="flex items-center gap-4 pr-5 pl-12 border-divider border-t first:border-t-0 h-15 animate-pulse"
          >
            <div className="bg-divider rounded-full size-6 shrink-0" />
            <div className={`h-3 rounded-full bg-divider ${width}`} />
          </div>
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 py-14 border-[1.5px] border-field border-dashed rounded-2xl text-center">
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
        <p className="font-display font-bold text-[22px]">A clean slate</p>
        <p className="max-w-75 text-[15px] text-muted leading-normal">
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

  /**
   * Forgets a press that has not turned into a drag.
   */
  function clearPendingPress() {
    window.clearTimeout(pendingPress.current?.timer);
    pendingPress.current = null;
  }

  /**
   * Starts dragging a row.
   * @param {HTMLLIElement} row - The row element that receives the pointer events.
   * @param {number} pointerId - The id of the pointer doing the drag.
   * @param {number} index - The index of the dragged todo.
   */
  function startDrag(row: HTMLLIElement, pointerId: number, index: number) {
    clearPendingPress();
    // Keep receiving pointer events on this row even when the pointer leaves it
    row.setPointerCapture(pointerId);
    setDragFrom(index);
    setDragOver(index);
  }

  /**
   * Stores the index of the row under the given point as the drop target.
   * @param {number} x - The horizontal position in the window (clientX).
   * @param {number} y - The vertical position in the window (clientY).
   */
  function updateDragOver(x: number, y: number) {
    const row = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-index]");
    if (row) setDragOver(Number(row.dataset.index));
  }

  /**
   * Handles a press on a row: the handle starts a drag at once, the rest of the row
   * waits for a mouse move (mouse) or a long-press (touch and pen).
   * @param {React.PointerEvent<HTMLLIElement>} e - The pointer down event.
   * @param {number} index - The index of the row that was pressed.
   */
  function handlePointerDown(
    e: React.PointerEvent<HTMLLIElement>,
    index: number,
  ) {
    justDragged.current = false;
    if (e.button !== 0) return; // Ignore right and middle clicks

    const row = e.currentTarget;
    const { pointerId } = e;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    if ((e.target as HTMLElement).closest("[data-drag-handle]")) {
      startDrag(row, pointerId, index);
      return;
    }

    pendingPress.current = { index, x: e.clientX, y: e.clientY };
    if (e.pointerType !== "mouse") {
      // A quick swipe scrolls instead: the browser fires pointercancel, which clears this timer
      pendingPress.current.timer = window.setTimeout(
        () => startDrag(row, pointerId, index),
        LONG_PRESS_DELAY,
      );
    }
  }

  /**
   * Starts a mouse drag after a small move, and tracks which row is under the pointer while dragging.
   * @param {React.PointerEvent<HTMLLIElement>} e - The pointer move event.
   */
  function handlePointerMove(e: React.PointerEvent<HTMLLIElement>) {
    const press = pendingPress.current;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    if (dragFrom === null) {
      if (!press) return;
      const distance = Math.hypot(e.clientX - press.x, e.clientY - press.y);

      if (e.pointerType === "mouse" && distance > MOUSE_DRAG_DISTANCE) {
        startDrag(e.currentTarget, e.pointerId, press.index);
      } else if (e.pointerType !== "mouse" && distance > LONG_PRESS_TOLERANCE) {
        // The finger moved before the long-press: it is a swipe, not a drag
        clearPendingPress();
      }
      return;
    }

    // Pointer capture sends every move to the dragged row, so look up the row under the pointer
    updateDragOver(e.clientX, e.clientY);
  }

  /**
   * Drops the dragged todo, or does nothing if the press never became a drag.
   */
  function handlePointerUp() {
    clearPendingPress();
    if (dragFrom === null) return;

    // The browser fires a click after pointerup; it must not toggle the dropped task
    justDragged.current = true;
    handleDragEnd();
  }

  /**
   * Cancels the drag without reordering (e.g. the browser took over the touch to scroll).
   */
  function handlePointerCancel() {
    clearPendingPress();
    setDragFrom(null);
    setDragOver(null);
  }

  /**
   * Swallows the click that follows a drag, so dropping a task does not toggle it.
   * @param {React.MouseEvent<HTMLLIElement>} e - The click event, in the capture phase.
   */
  function handleClickCapture(e: React.MouseEvent<HTMLLIElement>) {
    if (!justDragged.current) return;
    justDragged.current = false;
    e.stopPropagation();
    e.preventDefault();
  }

  return (
    <ul
      aria-label="Todos"
      className={`overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04),0_8px_24px_rgba(22,24,29,0.05)] ${dragFrom !== null ? "cursor-grabbing" : ""}`}
    >
      {todos.map((todo, index) => {
        // Show a line on the side the dragged todo will land on
        const isDropTarget =
          dragFrom !== null && dragOver === index && dragFrom !== index;

        return (
          <li
            key={todo.id}
            data-index={index}
            // select-none and no touch callout: a long-press must not select text or open the iOS menu
            className={`relative border-t border-divider select-none first:border-t-0 [-webkit-touch-callout:none] ${dragFrom === index ? "opacity-45" : ""}`}
            onPointerDown={(e) => handlePointerDown(e, index)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            // No need for current Chrome
            onClickCapture={handleClickCapture}
            onContextMenu={(e) => {
              // Android opens the context menu on a long-press
              if (pendingPress.current || dragFrom !== null) e.preventDefault();
            }}
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
