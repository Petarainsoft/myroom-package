import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  Switch,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Visibility as PreviewIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
} from "@mui/icons-material";
import avatarService, {
  AvatarResource,
  AvatarCategory,
  CreateAvatarResourceRequest,
  UpdateAvatarResourceRequest,
  CreateAvatarCategoryRequest,
  UpdateAvatarCategoryRequest,
} from "../services/avatar.service";
import GLBViewer, { GLBViewerUrl } from "../components/GLBViewer";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AvatarCategoriesAndParts: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  // Avatar Resources state
  const [resources, setResources] = useState<AvatarResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterGender, setFilterGender] = useState<string>("");
  const [filterPartType, setFilterPartType] = useState<string>("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<AvatarResource | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceGender, setResourceGender] = useState("UNISEX");
  const [resourcePartType, setResourcePartType] = useState("BODY");
  const [resourceCategoryId, setResourceCategoryId] = useState<
    string | undefined
  >();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [resourceIsPremium, setResourceIsPremium] = useState(false);
  const [resourceEditing, setResourceEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resourceTags, setResourceTags] = useState<string>("");
  const [resourceKeywords, setResourceKeywords] = useState<string>("");
  const [resourceVersion, setResourceVersion] = useState("1.0");
  const [resourceId, setResourceId] = useState("");

  // Avatar Categories state
  const [categories, setCategories] = useState<AvatarCategory[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState<AvatarCategory | null>(
    null
  );
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryType, setCategoryType] = useState<"gender" | "part_type">(
    "part_type"
  );
  const [categoryParentId, setCategoryParentId] = useState<string | null>(null);
  const [categorySortOrder, setCategorySortOrder] = useState(0);
  const [categoryPath, setCategoryPath] = useState("");
  const [categoryView, setCategoryView] = useState<"flat" | "tree">("tree");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [flatCategories, setFlatCategories] = useState<AvatarCategory[]>([]);

  // Common state
  const [error, setError] = useState<string | null>(null);

  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "UNISEX", label: "Unisex" },
  ];

  const partTypeOptions = [
    { value: "BODY", label: "Body" },
    { value: "HAIR", label: "Hair" },
    { value: "TOP", label: "Top" },
    { value: "BOTTOM", label: "Bottom" },
    { value: "SHOES", label: "Shoes" },
    { value: "ACCESSORY", label: "Accessory" },
    { value: "FULLSET", label: "Full Set" },
  ];

  const maxFileSize = 100 * 1024 * 1024; // 100MB

  // Avatar Resources functions
  const fetchResources = async () => {
    setResourcesLoading(true);
    try {
      const result = await avatarService.getAvatarResources({
        page: page + 1,
        limit: rowsPerPage,
        categoryId: filterCategoryId || undefined,
        gender: filterGender || undefined,
        partType: filterPartType || undefined,
      });
      setResources(result.resources);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to fetch avatar resources:", err);
      setError("Failed to load avatar resources");
    } finally {
      setResourcesLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${maxFileSize / 1024 / 1024}MB`;
    }
    if (!file.name.toLowerCase().endsWith(".glb")) {
      return "Only GLB files are supported for avatar parts";
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validation = validateFile(selectedFile);
    if (validation) {
      setError(validation);
      return;
    }

    setFile(selectedFile);
    setResourceName(selectedFile.name.replace(".glb", ""));
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleResourceDelete = async (id: string) => {
    if (!confirm("Delete this avatar part?")) return;

    try {
      await avatarService.deleteAvatarResource(id);
      fetchResources();
    } catch (err) {
      console.error("Failed to delete avatar resource:", err);
      setError("Failed to delete avatar part");
    }
  };

  const handleResourceEdit = (resource: AvatarResource) => {
    setSelectedResource(resource);
    setResourceName(resource.name);
    setResourceGender(resource.gender);
    setResourcePartType(resource.partType);
    setResourceCategoryId(resource.categoryId);
    setResourceIsPremium(resource.isPremium);
    setResourceTags(resource.tags.join(", "));
    setResourceKeywords(resource.keywords.join(", "));
    setResourceVersion(resource.version);
    setResourceId(resource.resourceId || "");
    setEditOpen(true);
  };

  const handleResourcePreview = async (resource: AvatarResource) => {
    try {
      setSelectedResource(resource);
      setPreviewUrl(resource.s3Url);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Failed to get preview URL:", err);
      setError("Failed to load preview");
    }
  };

  const handleResourceUpdate = async () => {
    if (!selectedResource) return;

    try {
      setResourceEditing(true);
      const updateData: UpdateAvatarResourceRequest = {
        name: resourceName,
        gender: resourceGender as any,
        partType: resourcePartType as any,
        categoryId: resourceCategoryId,
        isPremium: resourceIsPremium,
        tags: resourceTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        keywords: resourceKeywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k),
        version: resourceVersion,
        resourceId: resourceId,
      };
      await avatarService.updateAvatarResource(selectedResource.id, updateData);
      setEditOpen(false);
      fetchResources();
    } catch (err) {
      console.error("Failed to update avatar resource:", err);
      setError("Failed to update avatar part");
    } finally {
      setResourceEditing(false);
    }
  };

  const handleResourceUpload = async () => {
    if (!file) return;

    console.log("Starting upload for file:", file);
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          console.log("Upload progress:", prev);
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const createData: CreateAvatarResourceRequest = {
        name: resourceName || file.name.replace(".glb", ""),
        gender: resourceGender as any,
        partType: resourcePartType as any,
        categoryId: resourceCategoryId,
        isPremium: resourceIsPremium,
        tags: resourceTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        keywords: resourceKeywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k),
        version: resourceVersion,
      };

      console.log("Create data prepared:", createData);
      console.log("Uploading file:", file.name, "Size:", file.size);

      await avatarService.createAvatarResource(createData, file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      console.log("File upload successful:", file.name);

      setTimeout(() => {
        setUploadOpen(false);
        setFile(null);
        setResourceName("");
        setResourceCategoryId(undefined);
        setUploadProgress(0);
        setResourceIsPremium(false);
        setResourceTags("");
        setResourceKeywords("");
        setResourceVersion("1.0");
        fetchResources();
        console.log("Post-upload reset completed");
      }, 500);
    } catch (err) {
      console.error("Failed to upload avatar resource:", err);
      setError("Failed to upload avatar part");
    } finally {
      setUploading(false);
      console.log("Upload process finished for file:", file?.name);
    }
  };

  const formatFileSize = (bytes: string) => {
    const numBytes = parseInt(bytes);
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (numBytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(numBytes) / Math.log(1024));
    return (
      Math.round((numBytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
    );
  };

  const getGenderColor = (gender: string) => {
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
      MALE: "primary",
      FEMALE: "secondary",
      UNISEX: "success",
    };
    return colors[gender] || "default";
  };

  const getPartTypeColor = (partType: string) => {
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
      BODY: "primary",
      HAIR: "warning",
      TOP: "info",
      BOTTOM: "secondary",
      SHOES: "error",
      ACCESSORY: "success",
      FULLSET: "default",
    };
    return colors[partType] || "default";
  };

  // Categories functions
  const fetchCategories = async () => {
    try {
      const data = await avatarService.getAvatarCategories();
      console.log("Fetched categories:", data); // Debug log
      setCategories(data);
      const flatten = (categories: AvatarCategory[], level = 0): (AvatarCategory & { level: number })[] =>
        categories.reduce((acc, category) => {
          const newCategory = { ...category, level };
          acc.push(newCategory);
          if (category.children && category.children.length > 0) {
        acc.push(...flatten(category.children, level + 1));
          }
          return acc;
        }, [] as (AvatarCategory & { level: number })[]);
      
      setFlatCategories(flatten(data));
    } catch (err) {
      console.error("Failed to fetch avatar categories:", err);
      setError("Failed to load avatar parts categories");
    }
  };

  const handleCategorySave = async () => {
    try {
      if (categoryEditing) {
        const updateData: UpdateAvatarCategoryRequest = {
          name: categoryName,
          description: categoryDescription || undefined,
          parentId: categoryParentId || undefined,
          sortOrder: categorySortOrder,
          isActive: true,
        };
        await avatarService.updateAvatarCategory(
          categoryEditing.id,
          updateData
        );
      } else {
        const createData: CreateAvatarCategoryRequest = {
          name: categoryName,
          description: categoryDescription || undefined,
          categoryType: categoryType,
          parentId: categoryParentId || undefined,
          sortOrder: categorySortOrder,
        };
        await avatarService.createAvatarCategory(createData);
      }

      setCategoryDialogOpen(false);
      resetCategoryForm();
      fetchCategories();
    } catch (err) {
      console.error("Failed to save avatar category:", err);
      setError("Failed to save avatar parts category");
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm("Delete this avatar category?")) return;

    try {
      await avatarService.deleteAvatarCategory(id);
      fetchCategories();
    } catch (err) {
      console.error("Failed to delete avatar category:", err);
      setError("Failed to delete avatar parts category");
    }
  };

  const handleCategoryEdit = (category: AvatarCategory) => {
    setCategoryEditing(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setCategoryType(category.categoryType as "gender" | "part_type");
    setCategoryParentId(category.parentId || null);
    setCategorySortOrder(category.sortOrder);
    setCategoryPath(category.path || "");
    setCategoryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setCategoryEditing(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryType("part_type");
    setCategoryParentId(null);
    setCategorySortOrder(0);
    setCategoryPath("");
  };

  const renderCategoryTree = (categories: AvatarCategory[], level = 0) => {
    return categories.map((category) => (
      <React.Fragment key={category.id}>
        <TableRow>
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", pl: level * 2 }}>
              {level > 0 && (
                <SubdirectoryArrowRightIcon
                  sx={{ mr: 1, color: "text.secondary" }}
                />
              )}
              {category.children && category.children.length > 0 && (
                <IconButton
                  size="small"
                  onClick={() => {
                    const newExpanded = new Set(expandedCategories);
                    if (expandedCategories.has(category.id)) {
                      newExpanded.delete(category.id);
                    } else {
                      newExpanded.add(category.id);
                    }
                    setExpandedCategories(newExpanded);
                  }}
                >
                  {expandedCategories.has(category.id) ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
              )}
              {category.name}
            </Box>
          </TableCell>
          <TableCell>
            <Chip
              label={
                category.categoryType === "gender" ? "Gender" : "Part Type"
              }
              color={
                category.categoryType === "gender" ? "primary" : "secondary"
              }
              size="small"
            />
          </TableCell>
          <TableCell>{category.description || "Unknown"}</TableCell>
          <TableCell>{category.path || "Unknown"}</TableCell>
          <TableCell>{category.sortOrder}</TableCell>
          <TableCell>
            {new Date(category.createdAt).toLocaleDateString()}
          </TableCell>
          <TableCell>
            <Tooltip title="Edit">
              <IconButton
                onClick={() => handleCategoryEdit(category)}
                size="small"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => handleCategoryDelete(category.id)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
        {category.children &&
          expandedCategories.has(category.id) &&
          renderCategoryTree(category.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Effects
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [page, rowsPerPage, filterCategoryId, filterGender, filterPartType]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth={false} sx={{ maxWidth: '2304px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Avatar Parts Categories & Avatar Parts
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: "100%", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="avatar management tabs"
        >
          <Tab label="Avatar Parts" />
          <Tab label="Avatar Categories" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Avatar Parts Tab */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Avatar Parts</Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Avatar Part
            </Button>
          </Box>

          {/* Filters */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter by Parts Category</InputLabel>
              <Select
                value={filterCategoryId}
                label="Filter by Parts Category"
                onChange={(e) => setFilterCategoryId(e.target.value)}
              >
                <MenuItem value="">All Parts Categories</MenuItem>
                {flatCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={filterGender}
                label="Gender"
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <MenuItem value="">All Genders</MenuItem>
                {genderOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Part Type</InputLabel>
              <Select
                value={filterPartType}
                label="Part Type"
                onChange={(e) => setFilterPartType(e.target.value)}
              >
                <MenuItem value="">All Parts</MenuItem>
                {partTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(filterCategoryId || filterGender || filterPartType) && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setFilterCategoryId("");
                  setFilterGender("");
                  setFilterPartType("");
                  setPage(0);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>

          {/* Resources Table */}
          {resourcesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Resource ID</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Part Type</TableCell>
                    <TableCell>Parts Category</TableCell>
                    <TableCell>Access</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>{resource.name}</TableCell>
                      <TableCell>{resource.resourceId}</TableCell>
                      <TableCell>
                        <Chip
                          label={resource.gender}
                          color={getGenderColor(resource.gender)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={resource.partType}
                          color={getPartTypeColor(resource.partType)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {resource.category?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={resource.isPremium ? "Premium" : "Free"}
                          color={resource.isPremium ? "warning" : "success"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatFileSize(resource.fileSize)}</TableCell>
                      <TableCell>{resource.version}</TableCell>
                      <TableCell>
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Preview">
                          <IconButton
                            onClick={() => handleResourcePreview(resource)}
                            size="small"
                          >
                            <PreviewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleResourceEdit(resource)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton
                            onClick={async () => {
                              try {
                                const blob =
                                  await avatarService.downloadAvatarResource(
                                    resource.id
                                  );
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = resource.name + ".glb";
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              } catch (err) {
                                setError("Failed to download file");
                              }
                            }}
                            size="small"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleResourceDelete(resource.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {resources.length === 0 && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No avatar parts found. Upload your first avatar part to get
                    started.
                  </Typography>
                </Box>
              )}

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Avatar Categories Tab */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Avatar Parts Categories</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetCategoryForm();
                setCategoryDialogOpen(true);
              }}
            >
              Add New Category
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={categoryView}
              exclusive
              onChange={(event, newView) => {
                if (newView !== null) {
                  setCategoryView(newView);
                }
              }}
              size="small"
            >
              <ToggleButton value="tree">Tree View</ToggleButton>
              <ToggleButton value="flat">Flat View</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>Sort Order</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoryView === "tree"
                ? renderCategoryTree(categories.filter((c) => !c.parentId))
                : flatCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            category.categoryType === "gender"
                              ? "Gender"
                              : "Part Type"
                          }
                          color={
                            category.categoryType === "gender"
                              ? "primary"
                              : "secondary"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{category.description || "Unknown"}</TableCell>
                      <TableCell>{category.path || "Unknown"}</TableCell>
                      <TableCell>{category.sortOrder}</TableCell>
                      <TableCell>
                        {new Date(category.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleCategoryEdit(category)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleCategoryDelete(category.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {categories.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No avatar parts categories found. Create your first parts
                category (Female, Male, Top, Bottom, Accessory) to get started.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload New Avatar Part</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: dragOver ? "primary.main" : "grey.300",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: dragOver ? "action.hover" : "background.paper",
                mb: 2,
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".glb"
                style={{ display: "none" }}
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    handleFileSelect(selectedFile);
                  }
                }}
              />
              <AttachFileIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
              />
              <Typography variant="body1">
                Drop GLB file here or click to select
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maximum size: {maxFileSize / 1024 / 1024}MB
              </Typography>
              {file && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: "primary.main" }}
                >
                  Selected: {file.name}
                </Typography>
              )}
            </Box>

            {uploading && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Uploading...
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            <TextField
              fullWidth
              label="Avatar Part Name"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              margin="normal"
              placeholder="Enter avatar part name"
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Category</InputLabel>
              <Select
                value={resourceCategoryId || ""}
                label="Category"
                onChange={(e) =>
                  setResourceCategoryId(e.target.value || undefined)
                }
              >
                {flatCategories
                  .filter((category) => category.level === 1) // Filter for level 1 categories
                  .map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.path}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Version"
              value={resourceVersion}
              onChange={(e) => setResourceVersion(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Tags (comma separated)"
              value={resourceTags}
              onChange={(e) => setResourceTags(e.target.value)}
              margin="normal"
              placeholder="casual, modern, stylish"
            />

            <TextField
              fullWidth
              label="Keywords (comma separated)"
              value={resourceKeywords}
              onChange={(e) => setResourceKeywords(e.target.value)}
              margin="normal"
              placeholder="shirt, clothing, top"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={resourceIsPremium}
                  onChange={(e) => setResourceIsPremium(e.target.checked)}
                />
              }
              label="Premium Avatar Part"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResourceUpload}
            variant="contained"
            disabled={!file || uploading}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Avatar Part</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Avatar Part Name"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            margin="normal"
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Category</InputLabel>
            <Select
              value={resourceCategoryId || ""}
              label="Category"
              onChange={(e) =>
                setResourceCategoryId(e.target.value || undefined)
              }
            >
              {flatCategories
                .filter((category) => category.level === 1) // Filter for level 1 categories
                .map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Version"
            value={resourceVersion}
            onChange={(e) => setResourceVersion(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Tags (comma separated)"
            value={resourceTags}
            onChange={(e) => setResourceTags(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Keywords (comma separated)"
            value={resourceKeywords}
            onChange={(e) => setResourceKeywords(e.target.value)}
            margin="normal"
          />

          <FormControlLabel
            control={
              <Switch
                checked={resourceIsPremium}
                onChange={(e) => setResourceIsPremium(e.target.checked)}
              />
            }
            label="Premium Avatar Part"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResourceUpdate}
            variant="contained"
            disabled={resourceEditing}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {categoryEditing
            ? "Edit Avatar Parts Category"
            : "Add New Avatar Parts Category"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Parts Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            margin="normal"
            placeholder="Enter parts category name (e.g., Female, Male, Top, Bottom, Accessory)"
          />

          <TextField
            fullWidth
            label="Description"
            value={categoryDescription}
            onChange={(e) => setCategoryDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Category Type</InputLabel>
            <Select
              value={categoryType}
              label="Category Type"
              onChange={(e) =>
                setCategoryType(e.target.value as "gender" | "part_type")
              }
              disabled={!!categoryEditing}
            >
              <MenuItem value="gender">Gender</MenuItem>
              <MenuItem value="part_type">Part Type</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Parent Parts Category</InputLabel>
            <Select
              value={categoryParentId || ""}
              label="Parent Parts Category"
              onChange={(e) => setCategoryParentId(e.target.value || null)}
            >
              <MenuItem value="">No Parent Parts Category</MenuItem>
              {flatCategories
                .filter((c) => c.id !== categoryEditing?.id)
                .map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Sort Order"
            type="number"
            value={categorySortOrder}
            onChange={(e) =>
              setCategorySortOrder(parseInt(e.target.value) || 0)
            }
            margin="normal"
            helperText="Lower numbers appear first"
          />
          <TextField
            fullWidth
            label="Path"
            value={categoryPath}
            onChange={(e) => setCategoryPath(e.target.value)}
            margin="normal"
            helperText="Unique path for the category"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCategorySave} variant="contained">
            {categoryEditing ? "Update" : "Create Category"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Preview</DialogTitle>
        <DialogContent>
          {previewUrl ? (
            <GLBViewerUrl url={previewUrl} />
          ) : (
            <Typography>Cannot preview this file type</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AvatarCategoriesAndParts;
