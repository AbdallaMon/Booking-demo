"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  FormControlLabel,
  Checkbox,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tooltip,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ApartmentIcon from "@mui/icons-material/Apartment";

const EMPTY_FORM = {
  name: "",
  placeId: "",
  description: "",
  capacity: 1,
  rooms: 1,
  bathrooms: 1,
  floor: "",
  amenities: "",
  basePriceNotes: "",
  price6h: "",
  price12h: "",
  price24h: "",
  pricePerDay: "",
  supports6h: true,
  supports12h: true,
  supports24h: true,
  supportsMultiDay: false,
  isActive: true,
};

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPlace, setFilterPlace] = useState("");

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        fetch("/api/units"),
        fetch("/api/places"),
      ]);
      setUnits(await uRes.json());
      setPlaces(await pRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, placeId: places[0]?.id ?? "" });
    setSaveError("");
    setOpen(true);
  }

  function openEdit(unit) {
    setEditId(unit.id);
    setForm({
      name: unit.name,
      placeId: unit.placeId,
      description: unit.description ?? "",
      capacity: unit.capacity,
      rooms: unit.rooms,
      bathrooms: unit.bathrooms,
      floor: unit.floor ?? "",
      amenities: unit.amenities ?? "",
      basePriceNotes: unit.basePriceNotes ?? "",
      price6h: unit.price6h ?? "",
      price12h: unit.price12h ?? "",
      price24h: unit.price24h ?? "",
      pricePerDay: unit.pricePerDay ?? "",
      supports6h: unit.supports6h,
      supports12h: unit.supports12h,
      supports24h: unit.supports24h,
      supportsMultiDay: unit.supportsMultiDay,
      isActive: unit.isActive,
    });
    setSaveError("");
    setOpen(true);
  }

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  async function handleSave() {
    setSaveError("");
    if (!form.name.trim() || !form.placeId) {
      setSaveError("Name and place are required");
      return;
    }
    setSaving(true);
    try {
      const method = editId ? "PUT" : "POST";
      const body = editId ? { id: editId, ...form } : form;
      const res = await fetch("/api/units", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setOpen(false);
      await fetchAll();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/units?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Delete failed");
        return;
      }
      setDeleteId(null);
      await fetchAll();
    } catch (e) {
      alert(e.message);
    }
  }

  const filtered = filterPlace
    ? units.filter((u) => u.placeId === filterPlace)
    : units;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5">Units / Apartments</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage apartment units, pricing, and availability.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Unit
        </Button>
      </Box>

      {/* Filter */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Place</InputLabel>
          <Select
            value={filterPlace}
            label="Filter by Place"
            onChange={(e) => setFilterPlace(e.target.value)}
          >
            <MenuItem value="">All Places</MenuItem>
            {places.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} unit(s)
        </Typography>
      </Box>

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
                    <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Place</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Prices (EGP)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Supports</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bookings</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        align="center"
                        sx={{ py: 5, color: "text.secondary" }}
                      >
                        No units yet. Click &quot;Add Unit&quot; to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <ApartmentIcon fontSize="small" color="primary" />
                            <Box>
                              <Typography fontWeight={600} fontSize={13}>
                                {u.name}
                              </Typography>
                              {u.description && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                  sx={{ maxWidth: 160, display: "block" }}
                                >
                                  {u.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.place?.name}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            🛏 {u.rooms}r · 🚿 {u.bathrooms}b · 👥 {u.capacity}
                            {u.floor != null ? ` · F${u.floor}` : ""}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" component="div">
                            {u.price6h ?? "—"} / {u.price12h ?? "—"} /{" "}
                            {u.price24h ?? "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            6h / 12h / 24h
                          </Typography>
                          {u.pricePerDay && (
                            <Typography
                              variant="caption"
                              display="block"
                              color="secondary.main"
                            >
                              {u.pricePerDay} /day
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                          >
                            {u.supports6h && (
                              <Chip label="6h" size="small" color="info" />
                            )}
                            {u.supports12h && (
                              <Chip label="12h" size="small" color="info" />
                            )}
                            {u.supports24h && (
                              <Chip label="24h" size="small" color="info" />
                            )}
                            {u.supportsMultiDay && (
                              <Chip
                                label="Multi"
                                size="small"
                                color="secondary"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.isActive ? "Active" : "Inactive"}
                            color={u.isActive ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{u._count?.bookings ?? 0}</TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openEdit(u)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteId(u.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* Add / Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editId ? "Edit Unit" : "Add New Unit"}</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {saveError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Basic info */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Unit Name *"
                value={form.name}
                onChange={set("name")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Place *</InputLabel>
                <Select
                  value={form.placeId}
                  label="Place *"
                  onChange={set("placeId")}
                >
                  {places.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={form.description}
                onChange={set("description")}
              />
            </Grid>

            {/* Details */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Capacity (guests)"
                value={form.capacity}
                onChange={set("capacity")}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Rooms"
                value={form.rooms}
                onChange={set("rooms")}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Bathrooms"
                value={form.bathrooms}
                onChange={set("bathrooms")}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Floor (optional)"
                value={form.floor}
                onChange={set("floor")}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Amenities (comma-separated)"
                placeholder="WiFi, AC, Parking, Kitchen"
                value={form.amenities}
                onChange={set("amenities")}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Price notes (optional)"
                value={form.basePriceNotes}
                onChange={set("basePriceNotes")}
              />
            </Grid>

            {/* Pricing */}
            <Grid size={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Pricing (EGP)" size="small" />
              </Divider>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Price — 6h"
                value={form.price6h}
                onChange={set("price6h")}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Price — 12h"
                value={form.price12h}
                onChange={set("price12h")}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Price — 24h"
                value={form.price24h}
                onChange={set("price24h")}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Price — Per Day"
                value={form.pricePerDay}
                onChange={set("pricePerDay")}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Supported durations */}
            <Grid size={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Supported Durations" size="small" />
              </Divider>
            </Grid>
            {[
              { key: "supports6h", label: "6 Hours" },
              { key: "supports12h", label: "12 Hours" },
              { key: "supports24h", label: "24 Hours" },
              { key: "supportsMultiDay", label: "Multi-Day" },
            ].map(({ key, label }) => (
              <Grid size={{ xs: 6, sm: 3 }} key={key}>
                <FormControlLabel
                  control={<Checkbox checked={form[key]} onChange={set(key)} />}
                  label={label}
                />
              </Grid>
            ))}

            {/* Active */}
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isActive}
                    onChange={set("isActive")}
                    color="success"
                  />
                }
                label="Unit is Active / Available"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editId ? "Save Changes" : "Create Unit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Unit?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete the unit. Existing bookings will
            remain.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDelete(deleteId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
