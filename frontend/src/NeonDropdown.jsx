export default function NeonDropdown({ activeNetKey, setActiveNetKey, networks }) {
  return (
    <select
      value={activeNetKey}
      onChange={(e) => setActiveNetKey(e.target.value)}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(120,100,255,0.25)",
        padding: "10px 14px",
        borderRadius: "10px",
        color: "#dbeefe",
        cursor: "pointer",
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 18px rgba(120,100,255,0.15)",
        fontWeight: "600"
      }}
    >
      {Object.keys(networks).map((k) => (
        <option key={k} value={k} style={{ background: "#0b1220" }}>
          {networks[k].label}
        </option>
      ))}
    </select>
  );
}
