import React from "react";

export default function NeonToast({ type = "success", children, onClose }) {
  return (
    <div
      className={`msg ${type === "error" ? "msg-error" : "msg-success"}`}
      onClick={() => onClose?.()}
    >
      {children}
    </div>
  );
}
