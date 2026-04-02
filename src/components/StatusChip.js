/**
 * Reusable status chip for booking statuses.
 */
"use client";

import Chip from "@mui/material/Chip";

const CONFIG = {
  pending: { label: "Pending", color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  cancelled: { label: "Cancelled", color: "default" },
};

export default function StatusChip({ status }) {
  const cfg = CONFIG[status] ?? { label: status, color: "default" };
  return (
    <Chip
      label={cfg.label}
      color={cfg.color}
      size="small"
      sx={{ fontWeight: 700 }}
    />
  );
}
