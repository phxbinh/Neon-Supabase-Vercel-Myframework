// api/index.js  (hoặc api/[[...]].js)
import { neon } from "@neondatabase/serverless";
import { renderToString } from "../framework/vdom.core.js";
import { TodoApp } from "../app/pages/TodoApp.js";
import { queryClient } from "../framework/query.js";

const sql = neon(process.env.DATABASE_URL);

async function getTodosServer() {
  const rows = await sql`SELECT * FROM todos ORDER BY id DESC`;
  return rows;
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname;

  // Xử lý API routes (nếu bạn có /api/todos, /api/...)
  if (pathname.startsWith("/api/")) {
    try {
      // Dynamic import nếu cần, hoặc forward đến file khác
      const apiModule = await import("./todos.js"); // điều chỉnh nếu cần
      return apiModule.default(req, res);
    } catch (e) {
      console.error("API error:", e);
      res.statusCode = 500;
      res.end("API Error");
      return;
    }
  }

  // Tất cả các route còn lại → SSR HTML cho SPA
  try {
    const TODOS_KEY = "todos:list";
    let todos = [];

    try {
      todos = await getTodosServer();
      queryClient.setQueryData(TODOS_KEY, todos);
    } catch (dbErr) {
      console.error("DB error:", dbErr);
      // Có thể fallback todos = [] hoặc mock data
    }

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
  <!-- Nếu có tailwind hoặc css: <link rel="stylesheet" href="/styles.css"> -->
</head>
<body>
  <div id="app">${appHtml}</div>
  <script>
    window.__INITIAL_STATE__ = {
      todos: ${JSON.stringify(todos)}
    };
    alert('SSR handler chạy! Check console.');
  </script>
  <script type="module" src="/src/app/main.client.js"></script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate"); // optional: cache nhẹ
    res.end(html);
  } catch (err) {
    console.error("SSR error:", err);
    res.statusCode = 500;
    res.end("Server Error: " + err.message);
  }
}