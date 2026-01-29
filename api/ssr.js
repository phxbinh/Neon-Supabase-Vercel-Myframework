// api/ssr.js
import { neon } from "@neondatabase/serverless";
import { renderToString } from "../framework/vdom.core.js"; // điều chỉnh path nếu cần
import { TodoApp } from "../app/pages/TodoApp.js";
import { queryClient } from "../framework/query.js";

const sql = neon(process.env.DATABASE_URL);

async function getTodosServer() {
  const rows = await sql`SELECT * FROM todos ORDER BY id DESC`;
  return rows;
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);

  // Xử lý API nếu request là /api/...
  if (url.pathname.startsWith("/api/")) {
    try {
      const apiModule = await import("./todos.js");
      return apiModule.default(req, res);
    } catch (e) {
      console.error("API forward error:", e);
      res.statusCode = 500;
      res.end("API Error");
      return;
    }
  }

  // SSR cho các route khác
  try {
    const TODOS_KEY = "todos:list";
    const todos = await getTodosServer();
    queryClient.setQueryData(TODOS_KEY, todos);

    const appHtml = renderToString(
      TodoApp({
        data: { todos },
        status: "success"
      })
    );

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Todo App SSR</title>
  <!-- Thêm CSS nếu có: <link rel="stylesheet" href="/public/styles.css"> -->
</head>
<body>
  <div id="app">${appHtml}</div>
  <script>
    window.__INITIAL_STATE__ = {
      todos: ${JSON.stringify(todos)}
    };
  </script>
  <script type="module" src="/src/app/main.client.js"></script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.end(html);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Server Error");
  }
}