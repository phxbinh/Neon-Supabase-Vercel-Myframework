// api/index.js  (hoặc api/[[...]].js để catch-all)
import { neon } from "@neondatabase/serverless";
import { renderToString } from "../src/framework/vdom.core.js";
import { TodoApp } from "../src/app/pages/TodoApp.js";
import { queryClient } from "../src/framework/query.js";

const sql = neon(process.env.DATABASE_URL);

// Hàm fetch todos từ Neon (có thể tách riêng nếu nhiều route dùng)
async function fetchTodos() {
  try {
    const rows = await sql`SELECT * FROM todos ORDER BY id DESC`;
    return rows;
  } catch (err) {
    console.error("Neon fetch error:", err);
    return []; // fallback empty để không crash
  }
}

// Metadata động theo route (dễ mở rộng khi có thêm page)
function getPageMeta(pathname) {
  if (pathname === '/' || pathname === '') {
    return {
      title: 'Todo App - Quản lý công việc hàng ngày',
      description: 'Ứng dụng Todo nhanh, nhẹ với Neon DB, Supabase Auth và framework custom VDOM Hooks.',
      ogImage: '/og-home.jpg', // nếu bạn có ảnh OG
    };
  }

  // Ví dụ route chi tiết todo (nếu có sau này)
  if (pathname.startsWith('/todo/')) {
    const id = pathname.split('/')[2] || 'unknown';
    return {
      title: `Todo #${id} - Chi tiết công việc`,
      description: 'Xem và chỉnh sửa todo cụ thể...',
      ogImage: '/og-todo.jpg',
    };
  }

  // Default fallback / 404
  return {
    title: 'Todo App - Không tìm thấy trang',
    description: 'Trang bạn yêu cầu không tồn tại.',
    ogImage: '/og-default.jpg',
  };
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname;

  // Xử lý các API routes riêng (nếu bạn có /api/todos, /api/auth, ...)
  if (pathname.startsWith('/api/')) {
    // Ví dụ: forward đến file api/todos.js hoặc xử lý trực tiếp
    if (pathname === '/api/todos') {
      const todos = await fetchTodos();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(todos));
      return;
    }

    // Nếu có route API khác → 404 hoặc forward
    res.statusCode = 404;
    res.end('API route not found');
    return;
  }

  // SSR cho tất cả các route còn lại (/, /about, /todo/123, ...)
  try {
    // Fetch data server-side
    const todos = await fetchTodos();

    // Cache query data cho client (nếu dùng react-query / tanstack-query style)
    const TODOS_KEY = ['todos', 'list'];
    queryClient.setQueryData(TODOS_KEY, todos);

    // Render app với initial data
    const appHtml = renderToString(
      TodoApp({
        initialData: { todos },
        status: todos.length ? 'success' : 'empty',
      })
    );

    // Lấy meta động
    const meta = getPageMeta(pathname);

    // Template HTML đầy đủ
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}" />
  <meta property="og:title" content="${meta.title}" />
  <meta property="og:description" content="${meta.description}" />
  <meta property="og:image" content="${meta.ogImage}" />
  <meta property="og:url" content="https://${req.headers.host}${pathname}" />
  <meta property="og:type" content="website" />
  <!-- Thêm favicon, css, etc. nếu cần -->
  <!-- <link rel="stylesheet" href="/dist/styles.css"> -->
</head>
<body>
  <div id="app">${appHtml}</div>

  <!-- Truyền initial state cho client hydrate -->
  <script>
    window.__INITIAL_STATE__ = {
      todos: ${JSON.stringify(todos)},
      queryCache: ${JSON.stringify(queryClient.getQueryCache()?.toJSON() || {})}
    };
  </script>

  <!-- Client entry -->
  <script type="module" src="/src/app/main.client.js"></script>

  <!-- Optional: debug SSR -->
  <!-- <script>console.log('SSR rendered with', window.__INITIAL_STATE__.todos.length, 'todos');</script> -->
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    // Cache nhẹ cho Vercel Edge (10 giây, stale-while-revalidate để fresh data)
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');
    res.end(html);
  } catch (err) {
    console.error('SSR handler error:', err);
    res.statusCode = 500;
    res.end('Server Error: ' + err.message);
  }
}