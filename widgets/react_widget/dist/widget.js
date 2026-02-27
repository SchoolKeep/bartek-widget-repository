import { jsxs as i, jsx as o } from "react/jsx-runtime";
import { createRoot as n } from "react-dom/client";
import { useState as c, useEffect as s } from "react";
function a({ sdk: t }) {
  const [e, r] = c(t.getProps());
  return s(() => t.on("propsChanged", r), [t]), /* @__PURE__ */ i("section", { className: "react-widget-section", children: [
    /* @__PURE__ */ o("h3", { className: "react-widget-title", children: e.title }),
    e.description && /* @__PURE__ */ o("p", { className: "react-widget-description", children: e.description })
  ] });
}
async function l(t) {
  await t.whenReady();
  const e = n(t.shadowRoot);
  e.render(/* @__PURE__ */ o(a, { sdk: t })), t.on("destroy", () => e.unmount());
}
export {
  l as init
};
