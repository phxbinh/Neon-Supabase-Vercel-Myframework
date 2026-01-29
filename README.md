# Neon-Supabase-Vercel-Myframework
## Sử dụng my framework (vdom.js, hooks.js router.js) để tạo dự án.  
- Sử dụng Neon làm server database.  
- Supabase làm server auth và bucket.storage.  
- Deploy trên vercel.  
- GitHub repo.  
- Google search.  
- Optimizer SEO -> SSR

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    // Giữ nguyên API route cũ
    {
      "source": "/api/todos",
      "destination": "/api/todos"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },

    // Tất cả còn lại (/, /about, bất kỳ route nào) → gọi ssr function
    {
      "source": "/(.*)",
      "destination": "/api/ssr"
    }
  ]
}
```

```json
{
  "version": 2,
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```


```json
{
  "version": 2,
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/api/index.js"
    }
  ]
}
```


