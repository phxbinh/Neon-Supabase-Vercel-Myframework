// framework/vdom.js
export function renderToString(vnode) {
  if (typeof vnode === "string" || typeof vnode === "number") {
    return escapeHtml(String(vnode));
  }
  if (vnode === null || vnode === undefined || vnode === false) {
    return "";
  }
  if (Array.isArray(vnode)) {
    return vnode.map(renderToString).join("");
  }

  const { tag, props = {}, children = [] } = vnode;

  let attrs = "";
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith("on")) continue;           // bỏ event
    if (v === null || v === undefined) continue;
    if (k === "style" && typeof v === "object") {
      const styleStr = Object.entries(v)
        .map(([prop, val]) => `${prop}: ${val}`)
        .join("; ");
      attrs += ` style="${escapeHtml(styleStr)}"`;
      continue;
    }
    attrs += ` ${k}="${escapeHtml(String(v))}"`;
  }

  const content = children.map(renderToString).join("");

  if (["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"].includes(tag)) {
    return `<${tag}${attrs}>`;
  }

  return `<${tag}${attrs}>${content}</${tag}>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}