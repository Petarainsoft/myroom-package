import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
} from "@mui/material";
import {
  Search as SearchIcon,
  ShoppingCart,
  Image as ImageIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { ResourceService } from "../services";
import { Resource, ItemCategory } from "../services/resource.service";
// API key context is no longer required for Resources page

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [downloadingResources, setDownloadingResources] = useState<Set<string>>(
    new Set()
  );
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  // Placeholder will use Icon instead of blank image
  const navigate = useNavigate();

  // Extract unique resource types from resources
  const resourceTypes = [
    ...new Set(resources.map((resource) => resource.type)),
  ];

  // Fetch data once on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const categoriesData = await ResourceService.getCategories();
      setCategories(categoriesData);

      // Fetch all accessible resources
      await searchResources();
    } catch (err: any) {
      if (err.message?.includes("No API key available")) {
        setError(
          "API key required. Please create an API key in your project first."
        );
      } else {
        setError(err.response?.data?.message || "Failed to fetch resources");
      }
      console.error("Error fetching resources:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { category?: string; type?: string; query?: string } = {};

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (selectedType) {
        params.type = selectedType;
      }

      if (searchQuery.trim()) {
        params.query = searchQuery.trim();
      }

      const data = await ResourceService.searchResources(params);
      setResources(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to search resources");
      console.error("Error searching resources:", err);
    } finally {
      setLoading(false);
    }
  };

  // Determine if resource is premium
  const isPremium = (resource: Resource) => {
    return resource.isPremium === true || resource.price > 0;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e: SelectChangeEvent) => {
    setSelectedCategory(e.target.value);
  };

  const handleTypeChange = (e: SelectChangeEvent) => {
    setSelectedType(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchResources();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedType("");
    // Trigger search with cleared filters
    searchResources();
  };

  const handleResourceClick = (resourceId: string) => {
    navigate(`/resources/${resourceId}`);
  };

  // Download feature removed

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getTypeColor = (type: string) => {
    const colors: Record<
      string,
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning"
    > = {
      model: "primary",
      texture: "secondary",
      animation: "info",
      scene: "success",
      audio: "warning",
      video: "error",
      document: "default",
      other: "default",
    };
    return colors[type] || "default";
  };

  if (loading && resources.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          Resources
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box component="form" onSubmit={handleSearch}>
            <Grid container spacing={2} sx={{ alignItems: "flex-end" }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Search Resources"
                  variant="outlined"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="category-select-label">Category</InputLabel>
                  <Select
                    labelId="category-select-label"
                    id="category-select"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    label="Category"
                  >
                    <MenuItem value="">
                      <em>All Categories</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="type-select-label">Resource Type</InputLabel>
                  <Select
                    labelId="type-select-label"
                    id="type-select"
                    value={selectedType}
                    onChange={handleTypeChange}
                    label="Resource Type"
                  >
                    <MenuItem value="">
                      <em>All Types</em>
                    </MenuItem>
                    {resourceTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    Search
                  </Button>
                  <Button variant="outlined" onClick={handleClearFilters}>
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : resources.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              No Resources Found
            </Typography>
            <Typography variant="body1">
              {categories.length === 0
                ? "No resource categories are available. You may need category permissions from an administrator."
                : "Try adjusting your search criteria or clearing filters."}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={1}>
            {resources.map((resource) => (
              <Grid size={{ xs: 12, sm: 4, md: 2 }} key={resource.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    "&:hover": {
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleResourceClick(resource.id)}
                >
                  {/* Thumbnail */}
                  <Box sx={{ position: "relative" }}>
                    <img
                      src={
                        resource.metadata?.thumbnailUrl ||
                        resource.metadata?.thumbnail
                      }
                      alt={resource.name}
                      style={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                        display:
                          resource.metadata?.thumbnailUrl ||
                          resource.metadata?.thumbnail
                            ? "block"
                            : "none",
                      }}
                    />
                    {!(
                      resource.metadata?.thumbnailUrl ||
                      resource.metadata?.thumbnail
                    ) && (
                      <Box
                        sx={{
                          width: "100%",
                          height: 100,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "grey.100",
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 40, color: "grey.500" }} />
                      </Box>
                    )}
                    <Chip
                      label={isPremium(resource) ? "Premium" : "Free"}
                      color={isPremium(resource) ? "warning" : "success"}
                      size="small"
                      sx={{ position: "absolute", top: 8, left: 8 }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        component="div"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        {resource.name}
                      </Typography>
                      {isPremium(resource) && (
                        <Chip label="Premium" color="warning" size="small" />
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={resource.type}
                        size="small"
                        color={getTypeColor(resource.type)}
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={resource.accessPolicy}
                        size="small"
                        color={
                          resource.accessPolicy === "public"
                            ? "success"
                            : "default"
                        }
                        variant="outlined"
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {resource.metadata?.description ||
                        "No description available"}
                    </Typography>

                    {resource.metadata?.fileSize && (
                      <Typography variant="caption" color="text.secondary">
                        Size: {formatFileSize(resource.metadata.fileSize)}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    {isPremium(resource) ? (
                      <Button
                        size="small"
                        startIcon={<ShoppingCart />}
                        onClick={() =>
                          navigate(`/resources/${resource.id}?purchase=true`)
                        }
                        color="warning"
                      >
                        Purchase
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => navigate(`/resources/${resource.id}`)}
                      >
                        View
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={!!downloadSuccess}
        autoHideDuration={6000}
        onClose={() => setDownloadSuccess(null)}
        message={downloadSuccess}
      />
    </Container>
  );
};

export default Resources;
