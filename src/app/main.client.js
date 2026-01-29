import '../framework/Debugger.js';
import '../framework/vdom.js';
import '../framework/hooks.js';
import '../framework/router.js';
//import '../framework/init_API.js';

import { TodoApp } from "./pages/TodoApp.js";
import { fetchTodos } from "../shared/api.js";
import { queryClient } from "../framework/query.js";

const { Router } = window.App;




// src/app/main.client.js
// ... imports giữ nguyên

// Hydrate initial state từ server
if (window.__INITIAL_STATE__?.todos) {
  alert(JSON.stringify(window.__INITIAL_STATE__?.todos))
  queryClient.setQueryData('todos:list', window.__INITIAL_STATE__.todos);
  // Optional: xóa để tiết kiệm bộ nhớ
  delete window.__INITIAL_STATE__;
}

Router.addRoute({
  path: "/",
  component: TodoApp,
  // Không cần loader prefetch nữa vì server đã làm
  // Nhưng vẫn có thể giữ để refetch background nếu muốn
  loader: async () => {
    // chỉ fetch nếu chưa có data (ít xảy ra)
    if (!queryClient.getQueryData('todos:list')) {
      await queryClient.prefetch('todos:list', fetchTodos);
    }
    return {};
  }
});

Router.init(document.getElementById("app"), { hash: true });




/* gốc
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
*/
