"use client";

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Divider,
  Stack,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import ApartmentIcon from "@mui/icons-material/Apartment";
import TelegramIcon from "@mui/icons-material/Telegram";

const STATUS_CONFIG = {
  pending: {
    icon: <HourglassEmptyIcon sx={{ fontSize: 56 }} />,
    color: "#FF6F00",
    bg: "#FFF8E1",
    title: "Pending Review",
    message:
      "Your booking has been submitted and is waiting for admin approval. You will receive a Telegram notification when it is reviewed.",
  },
  approved: {
    icon: <CheckCircleIcon sx={{ fontSize: 56 }} />,
    color: "#2E7D32",
    bg: "#E8F5E9",
    title: "Booking Approved! 🎉",
    message:
      "Your booking has been approved. Please check your Telegram for any instructions from the admin.",
  },
  rejected: {
    icon: <CancelIcon sx={{ fontSize: 56 }} />,
    color: "#C62828",
    bg: "#FFEBEE",
    title: "Booking Rejected",
    message:
      "Unfortunately your booking was not approved. Please check your Telegram for details.",
  },
  cancelled: {
    icon: <CancelIcon sx={{ fontSize: 56 }} />,
    color: "#757575",
    bg: "#F5F5F5",
    title: "Booking Cancelled",
    message: "This booking has been cancelled.",
  },
};

function fmt(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
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
        sx={{ minWidth: 150, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function BookingStatusClient({ booking }) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.cancelled;
  const typeLabel =
    {
      "6h": "6 Hours",
      "12h": "12 Hours",
      "24h": "24 Hours",
      multiday: "Multiple Days",
    }[booking.bookingType] ?? booking.bookingType;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F4F6F9", py: 4 }}>
      <Container maxWidth="md">
        {/* Hero status card */}
        <Card sx={{ mb: 3, textAlign: "center", p: 2 }}>
          <CardContent>
            <Box sx={{ color: cfg.color, mb: 1 }}>{cfg.icon}</Box>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              {cfg.title}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 480, mx: "auto", mb: 2 }}
            >
              {cfg.message}
            </Typography>
            <Chip
              label={
                booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
              }
              sx={{
                bgcolor: cfg.bg,
                color: cfg.color,
                fontWeight: 700,
                fontSize: 14,
              }}
            />
            {booking.adminNote && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  maxWidth: 480,
                  mx: "auto",
                  textAlign: "left",
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                >
                  MESSAGE FROM ADMIN:
                </Typography>
                <Typography variant="body2">{booking.adminNote}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

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
                <InfoRow
                  label="Booking ID"
                  value={<code style={{ fontSize: 12 }}>{booking.id}</code>}
                />
                <InfoRow label="Place" value={booking.place?.name} />
                <InfoRow label="Unit" value={booking.unit?.name} />
                <InfoRow label="Duration" value={typeLabel} />
                <InfoRow label="Check-in" value={fmt(booking.startAt)} />
                <InfoRow label="Check-out" value={fmt(booking.endAt)} />
                <InfoRow label="Guests" value={booking.peopleCount} />
                {booking.totalPrice != null && (
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
                      sx={{ minWidth: 150, fontWeight: 500 }}
                    >
                      Total Price
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="success.main"
                    >
                      {booking.totalPrice} EGP
                    </Typography>
                  </Box>
                )}
                <InfoRow label="Submitted" value={fmt(booking.createdAt)} />
              </CardContent>
            </Card>

            {/* Unit info */}
            {booking.unit && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Unit Information
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: "🛏 Rooms", value: booking.unit.rooms },
                      { label: "🚿 Bathrooms", value: booking.unit.bathrooms },
                      { label: "👥 Capacity", value: booking.unit.capacity },
                      booking.unit.floor != null && {
                        label: "🏢 Floor",
                        value: booking.unit.floor,
                      },
                    ]
                      .filter(Boolean)
                      .map((item) => (
                        <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                          <Typography fontWeight={700}>{item.value}</Typography>
                        </Grid>
                      ))}
                    {booking.unit.amenities && (
                      <Grid size={12}>
                        <Typography variant="caption" color="text.secondary">
                          Amenities
                        </Typography>
                        <Typography variant="body2">
                          {booking.unit.amenities}
                        </Typography>
                      </Grid>
                    )}
                    {booking.unit.description && (
                      <Grid size={12}>
                        <Typography variant="caption" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body2">
                          {booking.unit.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Customer + Actions */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Booking
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    {(booking.customer?.fullName ?? "?")[0]}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700}>
                      {booking.customer?.fullName ?? "Customer"}
                    </Typography>
                    {booking.customer?.telegramUsername && (
                      <Typography variant="body2" color="text.secondary">
                        @{booking.customer.telegramUsername}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  You will receive updates about this booking via Telegram.
                </Typography>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TelegramIcon />}
                  href={`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME ?? ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mb: 1 }}
                >
                  Open Telegram Bot
                </Button>

                {/* Receipt link if available */}
                {booking.receiptBlobUrl && (
                  <Button
                    fullWidth
                    variant="text"
                    size="small"
                    href={booking.receiptBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="secondary"
                  >
                    View Uploaded Receipt
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Status timeline */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status Timeline
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    {
                      status: "submitted",
                      label: "Booking Submitted",
                      done: true,
                      time: booking.createdAt,
                    },
                    {
                      status: "pending_review",
                      label: "Pending Admin Review",
                      done: true,
                    },
                    {
                      status: "decision",
                      label:
                        booking.status === "approved"
                          ? "Approved ✓"
                          : booking.status === "rejected"
                            ? "Rejected ✗"
                            : "Awaiting Decision",
                      done: booking.status !== "pending",
                      time:
                        booking.updatedAt !== booking.createdAt
                          ? booking.updatedAt
                          : null,
                      color:
                        booking.status === "approved"
                          ? "success.main"
                          : booking.status === "rejected"
                            ? "error.main"
                            : "text.secondary",
                    },
                  ].map((step, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        alignItems: "flex-start",
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: step.done
                            ? (step.color ?? "primary.main")
                            : "grey.300",
                          mt: 0.6,
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={step.done ? 600 : 400}
                          color={
                            step.done
                              ? (step.color ?? "text.primary")
                              : "text.disabled"
                          }
                        >
                          {step.label}
                        </Typography>
                        {step.time && (
                          <Typography variant="caption" color="text.disabled">
                            {fmt(step.time)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
