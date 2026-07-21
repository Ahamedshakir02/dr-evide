/* @ds-bundle: {"format":3,"namespace":"ShakirDesignSystem_2c28ea","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"Stat","sourcePath":"components/data-display/Stat.jsx"},{"name":"Tag","sourcePath":"components/data-display/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"3f519fb4fe1f","components/buttons/IconButton.jsx":"795a5e066257","components/data-display/Avatar.jsx":"7f9a6164cbb9","components/data-display/Badge.jsx":"feffc752c22f","components/data-display/Card.jsx":"a814eb9d62c2","components/data-display/Stat.jsx":"d7dc788834a1","components/data-display/Tag.jsx":"73b02073c736","components/feedback/Dialog.jsx":"f3f8fb293fb2","components/feedback/Toast.jsx":"b74cea47ffd0","components/feedback/Tooltip.jsx":"abd0d76b0245","components/forms/Checkbox.jsx":"23a9da432610","components/forms/Input.jsx":"89bfafa7317e","components/forms/Select.jsx":"62a4d3c5448e","components/forms/Switch.jsx":"77ccef2ef14d","components/navigation/Tabs.jsx":"3060792ad30c","ui_kits/app/App.jsx":"11e00754f141","ui_kits/app/Overview.jsx":"8387234543d3","ui_kits/app/Sidebar.jsx":"acc4d494f090","ui_kits/app/Topbar.jsx":"ff5bf6779f1b","ui_kits/marketing/image-slot.js":"9309434cb09c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ShakirDesignSystem_2c28ea = window.ShakirDesignSystem_2c28ea || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — the primary action primitive.
 * Variants map to brand intent: primary (Flare fill), secondary (bordered),
 * ghost (quiet), danger. Hover lifts + darkens one step; press scales to 0.98.
 */
function Button({
  variant = "primary",
  size = "md",
  pill = false,
  block = false,
  leadingIcon = null,
  trailingIcon = null,
  as = "button",
  className = "",
  children,
  ...rest
}) {
  const Tag = as;
  const classes = ["sh-btn", `sh-btn--${variant}`, size !== "md" && `sh-btn--${size}`, pill && "sh-btn--pill", block && "sh-btn--block", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: classes
  }, rest), leadingIcon, children, trailingIcon);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — a square, icon-only control for toolbars and nav.
 * Quiet by default (muted icon, transparent bg); hover fills surface-2.
 */
function IconButton({
  size = "md",
  solid = false,
  label,
  className = "",
  children,
  ...rest
}) {
  const classes = ["sh-iconbtn", size === "sm" && "sh-iconbtn--sm", solid && "sh-iconbtn--solid", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: classes,
    "aria-label": label,
    title: label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Avatar — circular user image or initials fallback.
 */
function Avatar({
  src,
  name = "",
  size = "md",
  className = "",
  ...rest
}) {
  const initials = name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const classes = ["sh-avatar", size !== "md" && `sh-avatar--${size}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: classes
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : initials || "?");
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — a small status pill for labels, counts, and states.
 * Tone maps to brand/semantic intent; keep them quiet unless flagging state.
 */
function Badge({
  tone = "neutral",
  solid = false,
  className = "",
  children,
  ...rest
}) {
  const cls = solid ? "sh-badge sh-badge--solid" : `sh-badge ${tone !== "neutral" ? `sh-badge--${tone}` : ""}`;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `${cls} ${className}`.trim()
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — the default surface container: surface + 1px border, optional shadow.
 * Structural cards use the panel radius; interactive cards lift on hover.
 */
function Card({
  panel = false,
  interactive = false,
  as = "div",
  className = "",
  children,
  ...rest
}) {
  const Tag = as;
  const classes = ["sh-card", panel && "sh-card--panel", interactive && "sh-card--interactive", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: classes
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Stat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Stat — the "lead with the number" data display: a big mono figure over a
 * quiet label. The value can carry the accent; the label stays muted.
 */
function Stat({
  value,
  label,
  accent = false,
  delta,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `sh-stat ${className}`.trim()
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "sh-mono",
    style: {
      fontSize: "var(--text-2xl)",
      fontWeight: "var(--fw-semibold)",
      lineHeight: 1.1,
      color: accent ? "var(--accent-text)" : "var(--text)"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      marginTop: "var(--space-1)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "sh-eyebrow",
    style: {
      letterSpacing: "0.04em",
      textTransform: "none",
      fontSize: "var(--text-sm)"
    }
  }, label), delta != null && /*#__PURE__*/React.createElement("span", {
    className: "sh-mono",
    style: {
      fontSize: "var(--text-xs)",
      color: delta >= 0 ? "var(--success)" : "var(--danger)"
    }
  }, delta >= 0 ? "▲" : "▼", " ", Math.abs(delta), "%")));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Stat.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag — a fully-rounded chip for filters and selections, with optional remove (×).
 */
function Tag({
  onRemove,
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `sh-tag ${className}`.trim()
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("span", {
    className: "sh-tag__x",
    role: "button",
    "aria-label": "Remove",
    onClick: onRemove
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
/**
 * Dialog — a centered modal over a scrim. Render conditionally on `open`.
 * Springs in; everything behind it stays calm.
 */
function Dialog({
  open,
  onClose,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  danger = false
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "sh-dialog__scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "sh-dialog",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === "string" ? title : undefined,
    onClick: e => e.stopPropagation()
  }, title && /*#__PURE__*/React.createElement("h2", {
    className: "sh-dialog__title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "sh-dialog__body"
  }, children), /*#__PURE__*/React.createElement("div", {
    className: "sh-dialog__actions"
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    onClick: onClose
  }, cancelLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: danger ? "danger" : "primary",
    onClick: onConfirm || onClose
  }, confirmLabel))));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Toast — a compact confirmation on near-black. Tone sets the dot color.
 * Voice is warm + brief: "Nice — saved!".
 */
function Toast({
  tone = "accent",
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `sh-toast ${className}`.trim(),
    role: "status"
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: `sh-toast__dot ${tone !== "accent" ? `sh-toast__dot--${tone}` : ""}`.trim()
  }), /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
/**
 * Tooltip — a tiny near-black bubble shown on hover above its child.
 */
function Tooltip({
  label,
  children,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: `sh-tooltip ${className}`.trim()
  }, children, /*#__PURE__*/React.createElement("span", {
    className: "sh-tooltip__bubble",
    role: "tooltip"
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox — a labelled checkbox. Checked fills with Flare; focus shows the ring.
 */
function Checkbox({
  label,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: `sh-check ${className}`.trim()
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sh-check__box",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }))), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — a labelled text field. Pass `label` and optional `hint`/`error`.
 * Focus shows the Flare ring; invalid state borders danger.
 */
function Input({
  label,
  hint,
  error,
  id,
  className = "",
  textarea = false,
  ...rest
}) {
  const fieldId = id || `f-${Math.random().toString(36).slice(2, 8)}`;
  const Control = textarea ? "textarea" : "input";
  return /*#__PURE__*/React.createElement("div", {
    className: "sh-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "sh-label",
    htmlFor: fieldId
  }, label), /*#__PURE__*/React.createElement(Control, _extends({
    id: fieldId,
    className: `${textarea ? "sh-textarea" : "sh-input"} ${className}`.trim(),
    "aria-invalid": error ? "true" : undefined
  }, rest)), (hint || error) && /*#__PURE__*/React.createElement("span", {
    className: `sh-hint ${error ? "sh-hint--error" : ""}`.trim()
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — a labelled native dropdown with the brand chevron and Flare focus ring.
 */
function Select({
  label,
  hint,
  id,
  className = "",
  children,
  ...rest
}) {
  const fieldId = id || `s-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("div", {
    className: "sh-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "sh-label",
    htmlFor: fieldId
  }, label), /*#__PURE__*/React.createElement("select", _extends({
    id: fieldId,
    className: `sh-select ${className}`.trim()
  }, rest), children), hint && /*#__PURE__*/React.createElement("span", {
    className: "sh-hint"
  }, hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Switch — a labelled on/off toggle. Track fills Flare when on; thumb springs across.
 */
function Switch({
  label,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: `sh-switch ${className}`.trim(),
    style: {
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sh-switch__track",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sh-switch__thumb",
    "aria-hidden": "true"
  }), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Tabs — an underline tab strip. Controlled via `value` + `onChange`, or
 * uncontrolled with `defaultValue`. Items: [{ value, label }].
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  className = ""
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value);
  const active = value !== undefined ? value : internal;
  const select = v => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: `sh-tabs ${className}`.trim(),
    role: "tablist"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.value,
    role: "tab",
    className: "sh-tab",
    "aria-selected": active === it.value,
    onClick: () => select(it.value)
  }, it.label)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/App.jsx
try { (() => {
/* global React */
// App — login → dashboard, view switching, and the Send money dialog.
function ThengaApp() {
  const {
    Button,
    Input,
    Dialog,
    Toast
  } = window.ShakirDesignSystem_2c28ea;
  const Sidebar = window.TPSidebar;
  const Topbar = window.TPTopbar;
  const Overview = window.TPOverview;
  const [authed, setAuthed] = React.useState(false);
  const [view, setView] = React.useState("overview");
  const [sendOpen, setSendOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  function flash(msg) {
    setToast(msg);
    clearTimeout(window.__tpToast);
    window.__tpToast = setTimeout(() => setToast(null), 2600);
  }
  if (!authed) {
    return /*#__PURE__*/React.createElement("div", {
      className: "tp-login"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tp-login__panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tp-brand tp-brand--lg"
    }, /*#__PURE__*/React.createElement("span", {
      className: "tp-brand__mark"
    }, "T"), /*#__PURE__*/React.createElement("span", {
      className: "tp-brand__word"
    }, "ThengaPari")), /*#__PURE__*/React.createElement("div", {
      className: "sh-eyebrow",
      style: {
        marginTop: 28
      }
    }, "Welcome back"), /*#__PURE__*/React.createElement("h1", {
      className: "tp-login__h1"
    }, "Money that", /*#__PURE__*/React.createElement("br", null), "minds itself"), /*#__PURE__*/React.createElement("div", {
      className: "tp-login__form"
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Work email",
      placeholder: "you@thenga.co",
      defaultValue: "you@thenga.co"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Password",
      type: "password",
      defaultValue: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      block: true,
      onClick: () => setAuthed(true)
    }, "Let's go"), /*#__PURE__*/React.createElement("button", {
      className: "tp-link tp-link--center",
      onClick: () => setAuthed(true)
    }, "Use a passkey instead \u2192"))), /*#__PURE__*/React.createElement("div", {
      className: "tp-login__aside"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tp-login__quote"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sh-eyebrow",
      style: {
        color: "var(--flare-300)"
      }
    }, "$23.8M settled this month"), /*#__PURE__*/React.createElement("p", null, "\u201CRestraint everywhere except the headline. The balance is the only thing shouting.\u201D"))));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "tp-shell"
  }, /*#__PURE__*/React.createElement(Sidebar, {
    view: view,
    setView: setView
  }), /*#__PURE__*/React.createElement("div", {
    className: "tp-main"
  }, /*#__PURE__*/React.createElement(Topbar, {
    onSend: () => setSendOpen(true)
  }), /*#__PURE__*/React.createElement("div", {
    className: "tp-scroll"
  }, view === "overview" ? /*#__PURE__*/React.createElement(Overview, null) : /*#__PURE__*/React.createElement("div", {
    className: "tp-empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tp-empty__ic"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "package-open"
  })), /*#__PURE__*/React.createElement("h2", {
    className: "tp-h2"
  }, "Nothing here yet"), /*#__PURE__*/React.createElement("p", {
    className: "tp-muted"
  }, "This is a UI-kit stub \u2014 the Overview screen has the full treatment."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setView("overview")
  }, "Back to overview")))), /*#__PURE__*/React.createElement(Dialog, {
    open: sendOpen,
    onClose: () => setSendOpen(false),
    title: "Send money",
    confirmLabel: "Send $1,200",
    cancelLabel: "Cancel",
    onConfirm: () => {
      setSendOpen(false);
      flash("Nice — sent $1,200 to Ada");
    }
  }, "Transfer from your operating account. Arrives in seconds on the same network."), toast && /*#__PURE__*/React.createElement("div", {
    className: "tp-toastwrap"
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success"
  }, toast)));
}
window.ThengaApp = ThengaApp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Overview.jsx
try { (() => {
/* global React */
// Overview — the money dashboard. One accent (Flare) on the hero metric + primary action.
function Overview() {
  const {
    Card,
    Badge,
    Stat,
    Tabs
  } = window.ShakirDesignSystem_2c28ea;
  const [range, setRange] = React.useState("30d");
  const bars = [42, 58, 39, 64, 71, 55, 80, 68, 90, 76, 61, 84];
  const txns = [{
    name: "Fontshare",
    sub: "Type license",
    amt: "−$96.00",
    when: "Today · 14:08",
    tone: "out",
    tag: "Software"
  }, {
    name: "Relay payout",
    sub: "Invoice #0049",
    amt: "+$4,200.00",
    when: "Today · 09:22",
    tone: "in",
    tag: "Income"
  }, {
    name: "Printly Co",
    sub: "Poster run",
    amt: "−$318.40",
    when: "Yesterday",
    tone: "out",
    tag: "Studio"
  }, {
    name: "Adobe",
    sub: "Subscription",
    amt: "−$59.99",
    when: "Mon",
    tone: "out",
    tag: "Software"
  }, {
    name: "Ada Lovelace",
    sub: "Reimbursement",
    amt: "+$120.00",
    when: "Sun",
    tone: "in",
    tag: "Transfer"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "tp-view"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tp-view__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sh-eyebrow"
  }, "Overview"), /*#__PURE__*/React.createElement("h1", {
    className: "tp-h1"
  }, "Good morning, Shakir")), /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      value: "7d",
      label: "7 days"
    }, {
      value: "30d",
      label: "30 days"
    }, {
      value: "ytd",
      label: "Year"
    }],
    value: range,
    onChange: setRange
  })), /*#__PURE__*/React.createElement("div", {
    className: "tp-stats"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "tp-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sh-eyebrow",
    style: {
      color: "var(--text-muted)"
    }
  }, "Total balance"), /*#__PURE__*/React.createElement("div", {
    className: "tp-hero__num sh-mono"
  }, "$23.8M"), /*#__PURE__*/React.createElement("div", {
    className: "tp-hero__row"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, "\u25B2 4.2%"), /*#__PURE__*/React.createElement("span", {
    className: "tp-muted"
  }, "vs last ", range === "ytd" ? "year" : "month")), /*#__PURE__*/React.createElement("div", {
    className: "tp-spark"
  }, bars.map((b, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "tp-spark__bar",
    style: {
      height: b + "%"
    }
  })))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Stat, {
    value: "$612K",
    label: "Runway \xB7 18 mo",
    delta: 2
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Stat, {
    value: "1,204",
    label: "Active cards",
    delta: 6
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(Stat, {
    value: "99.98%",
    label: "Settlement rate",
    delta: -1
  }))), /*#__PURE__*/React.createElement(Card, {
    className: "tp-table"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tp-table__head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "tp-h2"
  }, "Recent activity"), /*#__PURE__*/React.createElement("button", {
    className: "tp-link"
  }, "View all ", /*#__PURE__*/React.createElement("i", {
    "data-lucide": "arrow-right"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "tp-rows"
  }, txns.map((t, i) => /*#__PURE__*/React.createElement("div", {
    className: "tp-row",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "tp-row__ic " + (t.tone === "in" ? "is-in" : "")
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": t.tone === "in" ? "arrow-down-left" : "arrow-up-right"
  })), /*#__PURE__*/React.createElement("div", {
    className: "tp-row__main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tp-row__name"
  }, t.name), /*#__PURE__*/React.createElement("div", {
    className: "tp-row__sub"
  }, t.sub)), /*#__PURE__*/React.createElement(Badge, null, t.tag), /*#__PURE__*/React.createElement("div", {
    className: "tp-row__when sh-mono"
  }, t.when), /*#__PURE__*/React.createElement("div", {
    className: "tp-row__amt sh-mono " + (t.tone === "in" ? "is-in" : "")
  }, t.amt))))));
}
window.TPOverview = Overview;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Overview.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Sidebar.jsx
try { (() => {
/* global React */
// Sidebar — quiet dark nav. One accent: the active item's Flare rail.
const NAV = [{
  id: "overview",
  label: "Overview",
  icon: "layout-dashboard"
}, {
  id: "accounts",
  label: "Accounts",
  icon: "wallet"
}, {
  id: "activity",
  label: "Activity",
  icon: "arrow-left-right"
}, {
  id: "cards",
  label: "Cards",
  icon: "credit-card"
}, {
  id: "reports",
  label: "Reports",
  icon: "bar-chart-3"
}];
function Sidebar({
  view,
  setView
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: "tp-side"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tp-brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tp-brand__mark"
  }, "T"), /*#__PURE__*/React.createElement("span", {
    className: "tp-brand__word"
  }, "ThengaPari")), /*#__PURE__*/React.createElement("nav", {
    className: "tp-nav"
  }, NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    className: "tp-navitem" + (view === n.id ? " is-active" : ""),
    onClick: () => setView(n.id)
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": n.icon
  }), /*#__PURE__*/React.createElement("span", null, n.label)))), /*#__PURE__*/React.createElement("div", {
    className: "tp-side__foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "tp-navitem"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "settings"
  }), /*#__PURE__*/React.createElement("span", null, "Settings")), /*#__PURE__*/React.createElement("div", {
    className: "tp-side__user"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sh-avatar sh-avatar--sm"
  }, "SK"), /*#__PURE__*/React.createElement("div", {
    className: "tp-side__usermeta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tp-side__name"
  }, "Shakir K"), /*#__PURE__*/React.createElement("div", {
    className: "tp-side__mail"
  }, "you@thenga.co")), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevrons-up-down",
    style: {
      color: "var(--text-faint)",
      width: 16
    }
  }))));
}
window.TPSidebar = Sidebar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Topbar.jsx
try { (() => {
/* global React */
// Topbar — search + quiet icon actions + one primary CTA.
function Topbar({
  onSend
}) {
  const {
    Button,
    IconButton
  } = window.ShakirDesignSystem_2c28ea;
  return /*#__PURE__*/React.createElement("header", {
    className: "tp-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tp-search"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "search"
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search transactions, people, cards\u2026"
  }), /*#__PURE__*/React.createElement("span", {
    className: "tp-search__kbd sh-mono"
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    className: "tp-top__actions"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Notifications"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "bell"
  })), /*#__PURE__*/React.createElement(IconButton, {
    label: "Help"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "life-buoy"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    leadingIcon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "arrow-up-right"
    }),
    onClick: onSend
  }, "Send money")));
}
window.TPTopbar = Topbar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Topbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet = ':host{display:inline-block;position:relative;vertical-align:top;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' + '  cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .spill{display:block}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' + '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' + '  transition:border-color .12s}' + ':host([data-over]) .ring{border-color:#c96442}' + ':host([data-filled]) .ring{display:none}' +
  // Controls sit BELOW the mask (top:100%), absolutely positioned so the
  // author-declared slot height is unaffected. The gap is padding, not a
  // top offset, so the hover target stays contiguous with the frame.
  '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }
    constructor() {
      super();
      const root = this.attachShadow({
        mode: 'open'
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="ring" part="ring"></div>' + '</div>' + '<div class="spill">' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' + '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="clear" title="Remove image">Remove</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') {
          this._exitReframe(true);
          this._input.click();
        }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null);else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') && (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return {
        iw,
        ih,
        fw,
        fh,
        base: Math.max(fw / iw, fh / ih)
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w;
      this._spill.style.height = h;
      this._spill.style.left = l;
      this._spill.style.top = t;
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/image-slot.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
