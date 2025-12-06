import React, { useEffect, useState } from "react";

export default function GuideTour({ steps, open, onClose }) {
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!open) return;
    const step = steps[index];
    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.top + window.scrollY - 12,
      left: rect.left - 12,
      width: rect.width + 24,
      height: rect.height + 24
    });
  }, [open, index, steps]);

  if (!open) return null;
  const step = steps[index];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(3px)", zIndex: 999999
      }}
    >
      {/* highlight */}
      {pos && (
        <div
          style={{
            position: "absolute",
            ...pos,
            border: "2px solid #7e6cff",
            borderRadius: "14px",
            boxShadow: "0 0 25px #7e6cff",
            transition: "all .25s"
          }}
        ></div>
      )}

      {/* dialog */}
      <div
        style={{
          position: "absolute",
          top: "60%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(20,20,40,0.9)",
          border: "1px solid rgba(130,100,255,0.4)",
          padding: "22px",
          borderRadius: "12px",
          width: "320px",
          color: "#fff",
          boxShadow: "0 0 40px rgba(120,100,255,0.4)"
        }}
      >
        <h3>{step.title}</h3>
        <p style={{ opacity: 0.8 }}>{step.text}</p>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between" }}>
          <button className="btn outline" onClick={() => index > 0 && setIndex(index - 1)}>
            Back
          </button>
          {index < steps.length - 1 ? (
            <button className="btn neon" onClick={() => setIndex(index + 1)}>
              Next
            </button>
          ) : (
            <button className="btn neon" onClick={onClose}>
              Finish
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 6, right: 10,
            color: "#888", background: "none", border: "none", cursor: "pointer"
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
