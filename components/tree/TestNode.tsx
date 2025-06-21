import React from "react";

export function TestNode() {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "red",
        color: "white",
        padding: "20px",
        borderRadius: "8px",
        zIndex: 1000,
      }}>
      TEST NODE - If you see this, rendering is working
    </div>
  );
}
