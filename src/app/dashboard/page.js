import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Link,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ApartmentIcon from "@mui/icons-material/Apartment";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PendingIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StatCard from "@/components/StatCard";
import StatusChip from "@/components/StatusChip";

async function getStats() {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/stats`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

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

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back — here&#39;s what&#39;s happening with your rentals.
        </Typography>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Bookings"
            value={stats?.totalBookings ?? "—"}
            icon={<DashboardIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Pending Approval"
            value={stats?.pendingBookings ?? "—"}
            icon={<PendingIcon />}
            color="#FF6F00"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Active Now"
            value={stats?.activeNow ?? "—"}
            icon={<CheckCircleIcon />}
            color="success.main"
            subtitle="Approved & ongoing"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Ending Soon"
            value={stats?.endingSoon ?? "—"}
            icon={<AccessTimeIcon />}
            color="error.main"
            subtitle="Within next 2 hours"
          />
        </Grid>
      </Grid>

      {/* Second row */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Places"
            value={stats?.totalPlaces ?? "—"}
            icon={<LocationOnIcon />}
            color="secondary.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Active Units"
            value={stats?.totalUnits ?? "—"}
            icon={<ApartmentIcon />}
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Approved"
            value={stats?.approvedBookings ?? "—"}
            icon={<CheckCircleIcon />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* Recent bookings table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Bookings
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Place / Unit</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Check-in</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.recentBookings?.length ? (
                  stats.recentBookings.map((b) => (
                    <TableRow
                      key={b.id}
                      hover
                      component={Link}
                      href={`/dashboard/bookings/${b.id}`}
                      sx={{ cursor: "pointer", textDecoration: "none" }}
                    >
                      <TableCell>
                        {b.customer?.fullName ?? "—"}
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          @
                          {b.customer?.telegramUsername ??
                            b.customer?.telegramUserId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {b.place?.name}
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          {b.unit?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={b.bookingType}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{fmt(b.startAt)}</TableCell>
                      <TableCell>
                        {b.totalPrice != null ? `${b.totalPrice} EGP` : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={b.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      No bookings yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
