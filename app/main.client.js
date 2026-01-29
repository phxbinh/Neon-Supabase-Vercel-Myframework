import '../framework/Debugger.js';
import '../framework/vdom.js';
import '../framework/hooks.js';
import '../framework/router.js';
//import '../framework/init_API.js';

import { TodoApp } from "./pages/TodoApp.js";
import { fetchTodos } from "../shared/api.js";
import { queryClient } from "../framework/query.js";

const { Router } = window.App;
/*
Router.addRoute({
  path: "/",
  component: TodoApp,
  loader: async () => {
    
    if (window.__CACHE__?.todos) {
      return { todos: window.__CACHE__.todos };
    }
    const todos = await fetchTodos();
    window.__CACHE__ = {
      ...(window.__CACHE__ || {}),
      todos
    };
    return { todos };
  }
});
*/

// Trong file router config (ví dụ main.js hoặc nơi addRoute)
Router.addRoute({
  path: "/",
  component: TodoApp,
  loader: async () => {
    const key = 'todos:list';
    const todos = await queryClient.prefetch(key, fetchTodos);
    return { todos }; // vẫn trả về cho component nếu cần fallback
  }
});


Router.init(document.getElementById("app"), { hash: true });

