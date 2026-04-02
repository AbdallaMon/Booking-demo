"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import StatusChip from "@/components/StatusChip";

const BOOKING_TYPES = ["6h", "12h", "24h", "multiday"];

function fmt(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error("Failed to load bookings");
      setBookings(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.customer?.fullName?.toLowerCase().includes(q) ||
      b.customer?.telegramUsername?.toLowerCase().includes(q) ||
      b.unit?.name?.toLowerCase().includes(q) ||
      b.place?.name?.toLowerCase().includes(q) ||
      b.id?.toLowerCase().includes(q)
    );
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Bookings</Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage all customer bookings.
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="Search customer, unit, place…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ alignSelf: "center" }}
        >
          {filtered.length} booking(s)
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Unit / Place</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Check-in</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Check-out</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Guests</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Receipt</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        align="center"
                        sx={{ py: 5, color: "text.secondary" }}
                      >
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((b) => (
                      <TableRow key={b.id} hover>
                        <TableCell>
                          <Typography fontWeight={600} fontSize={13}>
                            {b.customer?.fullName ?? "Unknown"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @
                            {b.customer?.telegramUsername ??
                              b.customer?.telegramUserId ??
                              "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600} fontSize={13}>
                            {b.unit?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {b.place?.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={b.bookingType}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {fmt(b.startAt)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {fmt(b.endAt)}
                        </TableCell>
                        <TableCell>{b.peopleCount ?? "—"}</TableCell>
                        <TableCell>
                          {b.totalPrice != null ? (
                            <Typography
                              fontWeight={700}
                              color="success.main"
                              fontSize={13}
                            >
                              {b.totalPrice} EGP
                            </Typography>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={b.status} />
                        </TableCell>
                        <TableCell>
                          {b.receiptBlobUrl ? (
                            <Button
                              size="small"
                              variant="outlined"
                              href={b.receiptBlobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ fontSize: 11 }}
                            >
                              View
                            </Button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="text"
                            component={Link}
                            href={`/dashboard/bookings/${b.id}`}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
