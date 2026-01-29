
// src/app/pages/TodoApp.js
const { h } = window.App.VDOM;
const { useState } = window.App.Hooks;
import { queryClient } from '../../framework/query.js'; // hoặc import nếu có
import { fetchTodos, createTodo, removeTodo } from "../../shared/api.js";

// Dùng useQuery custom
const { useQuery } = window.App.Hooks;
export function TodoApp({ data, status: routeStatus }) {
  //export function TodoApp() {
    
  if (routeStatus === "loading") {
    return h("p", null, "Loading todos TodoApp.js ...");
  }

  const TODOS_KEY = 'todos:list';

  const { data: todos = [], status } = useQuery(TODOS_KEY, fetchTodos);

  const [input, setInput] = useState("");

  //alert(JSON.stringify(data))

  async function add() {
    if (!input.trim()) return;

    const optimisticTodo = {
      id: `temp-${Date.now()}`,
      text: input.trim(),
    };

    // Optimistic update
    queryClient.setQueryData(TODOS_KEY, prev => [...(prev || []), optimisticTodo]);

    setInput("");

    try {
      const realTodo = await createTodo(input.trim());
      // Thay thế optimistic bằng real data từ server
      queryClient.setQueryData(TODOS_KEY, prev =>
        prev.map(t => (t.id === optimisticTodo.id ? realTodo : t))
      );
    } catch (err) {
      console.error("Add failed", err);
      // Rollback: xóa optimistic
      queryClient.setQueryData(TODOS_KEY, prev =>
        prev?.filter(t => t.id !== optimisticTodo.id) || []
      );
      // Optional: alert("Thêm todo thất bại");
    } finally {
      // Luôn refetch để chắc chắn đồng bộ (nếu server có logic khác)
      queryClient.invalidateQueries(TODOS_KEY);
    }
  }

  async function del(id) {
    // Optimistic delete
    queryClient.setQueryData(TODOS_KEY, prev =>
      prev?.filter(t => t.id !== id) || []
    );

    try {
      await removeTodo(id);
    } catch (err) {
      console.error("Delete failed", err);
      // Rollback: fetch lại toàn bộ để an toàn
      const fresh = await fetchTodos();
      queryClient.setQueryData(TODOS_KEY, fresh);
    } finally {
      queryClient.invalidateQueries(TODOS_KEY);
    }
  }

  if (status === "loading") {
    return h("p", null, "Đang tải todos...");
  }

  return h("div", { className: "todo-app" },
    h("h1", { className: "todo-title" }, "Todo App"),

    h("div", { className: "todo-input-row" },
      h("input", {
        className: "todo-input",
        value: input,
        placeholder: "What needs to be done?",
        oninput: e => setInput(e.target.value)
      }),
      h("button", {
        className: "todo-add-btn",
        onclick: add
      }, "Add")
    ),

    h("ul", { className: "todo-list" },
      todos.map(t =>
        h("li", {
          className: "todo-item",
          key: t.id,
          style: t.id.startsWith('temp-') ? { opacity: 0.6 } : {} // optional: làm mờ temp item
        },
          h("span", { className: "todo-text" }, t.text),
          h("button", {
            className: "todo-delete-btn",
            onclick: () => del(t.id)
          }, "×")
        )
      )
    )
  );
}

