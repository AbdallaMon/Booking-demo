"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TelegramIcon from "@mui/icons-material/Telegram";
import ApartmentIcon from "@mui/icons-material/Apartment";
import PersonIcon from "@mui/icons-material/Person";
import StatusChip from "@/components/StatusChip";
import Link from "next/link";

function fmt(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 160, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1 }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionDialog, setActionDialog] = useState(null); // "approve" | "reject"
  const [adminNote, setAdminNote] = useState("");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`);
      if (!res.ok) throw new Error("Booking not found");
      setBooking(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  async function handleAction(type) {
    setActing(true);
    setActionError("");
    try {
      const res = await fetch(`/api/bookings/${id}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: adminNote.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setActionDialog(null);
      setAdminNote("");
      await fetchBooking();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActing(false);
    }
  }

  if (loading)
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!booking) return null;

  const { customer, place, unit } = booking;
  const canAct = booking.status === "pending";

  return (
    <Box>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        component={Link}
        href="/dashboard/bookings"
        sx={{ mb: 2 }}
      >
        Back to Bookings
      </Button>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </Typography>
          <StatusChip status={booking.status} />
        </Box>
        {canAct && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => {
                setActionDialog("approve");
                setActionError("");
              }}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => {
                setActionDialog("reject");
                setActionError("");
              }}
            >
              Reject
            </Button>
          </Stack>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Booking details */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <ApartmentIcon color="primary" />
                <Typography variant="h6">Booking Details</Typography>
              </Box>
              <InfoRow label="Place" value={place?.name} />
              <InfoRow label="Unit" value={unit?.name} />
              <InfoRow
                label="Booking Type"
                value={
                  {
                    "6h": "6 Hours",
                    "12h": "12 Hours",
                    "24h": "24 Hours",
                    multiday: "Multiple Days",
                  }[booking.bookingType] ?? booking.bookingType
                }
              />
              <InfoRow label="Check-in" value={fmt(booking.startAt)} />
              <InfoRow label="Check-out" value={fmt(booking.endAt)} />
              <InfoRow label="Guests" value={booking.peopleCount} />
              <InfoRow
                label="Total Price"
                value={
                  booking.totalPrice != null
                    ? `${booking.totalPrice} EGP`
                    : null
                }
              />
              <InfoRow label="Created at" value={fmt(booking.createdAt)} />
              {booking.adminNote && (
                <Box
                  sx={{ mt: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 2 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    ADMIN NOTE
                  </Typography>
                  <Typography variant="body2">{booking.adminNote}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Unit details */}
          {unit && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Unit Info
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      Rooms
                    </Typography>
                    <Typography fontWeight={600}>
                      {unit.rooms ?? "—"}
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      Bathrooms
                    </Typography>
                    <Typography fontWeight={600}>
                      {unit.bathrooms ?? "—"}
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="caption" color="text.secondary">
                      Capacity
                    </Typography>
                    <Typography fontWeight={600}>{unit.capacity}</Typography>
                  </Grid>
                  {unit.amenities && (
                    <Grid size={12}>
                      <Typography variant="caption" color="text.secondary">
                        Amenities
                      </Typography>
                      <Typography variant="body2">{unit.amenities}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Customer + Receipt */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <PersonIcon color="primary" />
                <Typography variant="h6">Customer</Typography>
              </Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Avatar sx={{ bgcolor: "primary.light" }}>
                  {(customer?.fullName ?? "?")[0]}
                </Avatar>
                <Box>
                  <Typography fontWeight={700}>
                    {customer?.fullName ?? "Unknown"}
                  </Typography>
                  {customer?.telegramUsername && (
                    <Typography variant="body2" color="text.secondary">
                      @{customer.telegramUsername}
                    </Typography>
                  )}
                </Box>
              </Box>
              <InfoRow
                label="Telegram ID"
                value={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <TelegramIcon fontSize="small" color="action" />
                    <code>{customer?.telegramUserId}</code>
                  </Box>
                }
              />
              {customer?.phone && (
                <InfoRow label="Phone" value={customer.phone} />
              )}
              <InfoRow
                label="Customer since"
                value={customer?.createdAt ? fmt(customer.createdAt) : "—"}
              />
            </CardContent>
          </Card>

          {/* Receipt */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Receipt
              </Typography>
              {booking.receiptBlobUrl ? (
                <Box>
                  {/* Preview if image */}
                  {/\.(jpg|jpeg|png|gif|webp)$/i.test(
                    booking.receiptBlobUrl,
                  ) ? (
                    <Box
                      component="img"
                      src={booking.receiptBlobUrl}
                      alt="Receipt"
                      sx={{
                        width: "100%",
                        borderRadius: 2,
                        mb: 1,
                        maxHeight: 300,
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "grey.100",
                        borderRadius: 2,
                        mb: 1,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Document receipt (not image preview)
                      </Typography>
                    </Box>
                  )}
                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<OpenInNewIcon />}
                    href={booking.receiptBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Full Receipt
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No receipt uploaded
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approve / Reject Dialog */}
      <Dialog
        open={!!actionDialog}
        onClose={() => setActionDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {actionDialog === "approve"
            ? "✅ Approve Booking"
            : "❌ Reject Booking"}
        </DialogTitle>
        <DialogContent>
          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            {actionDialog === "approve"
              ? "The customer will be notified on Telegram that their booking is approved."
              : "The customer will be notified on Telegram that their booking was rejected."}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Note (optional)"
            placeholder={
              actionDialog === "approve"
                ? "Any instructions for the customer…"
                : "Reason for rejection…"
            }
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={actionDialog === "approve" ? "success" : "error"}
            onClick={() => handleAction(actionDialog)}
            disabled={acting}
          >
            {acting
              ? "Processing…"
              : actionDialog === "approve"
                ? "Approve & Notify"
                : "Reject & Notify"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
