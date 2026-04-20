import React from "react";
import { STATUS_META } from "./StatusBadge.jsx";

const STAGES = ["Pending", "Confirmed", "In Delivery", "Shipped", "Invoiced", "Delivered"];

export function PipelineBar({ currentStatus }) {
  const currentStep = STATUS_META[currentStatus]?.step ?? 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", minWidth: 240 }}>
      {STAGES.map((stage, idx) => {
        const meta = STATUS_META[stage];
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        const isFuture = idx > currentStep;

        return (
          <React.Fragment key={stage}>
            {/* Node */}
            <div
              title={stage}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 700,
                border: `2px solid ${isActive ? meta.color : isDone ? meta.color : "var(--border)"}`,
                background: isActive ? meta.bg : isDone ? meta.color + "30" : "var(--bg-secondary)",
                color: isActive ? meta.color : isDone ? meta.color : "var(--text-muted)",
                transition: "all 0.3s ease",
                boxShadow: isActive ? `0 0 8px ${meta.color}44` : "none",
              }}
            >
              {isDone ? "✓" : idx + 1}
            </div>
            {/* Connector */}
            {idx < STAGES.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: isDone
                  ? `linear-gradient(90deg, ${meta.color}80, ${STATUS_META[STAGES[idx + 1]].color}40)`
                  : "var(--border)",
                transition: "background 0.3s ease",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
