// Complete file processing pipeline
async function handleFileUpload(files) {
  // Step 1: Validate files
  const validation = validateFiles(files);
  if (!validation.valid) {
    showError(validation.errors);
    return;
  }
  
  // Step 2: Extract if compressed
  let extractedFiles = files;
  if (isCompressed(files[0])) {
    extractedFiles = await extractArchive(files[0]);
  }
  
  // Step 3: Parse geospatial data
  const geojson = await parseToGeoJSON(extractedFiles);
  
  // Step 4: Validate geometry
  const geometryValid = validateGeometry(geojson);
  if (!geometryValid.valid) {
    showError(geometryValid.errors);
    return;
  }
  
  // Step 5: Calculate area with high precision
  const area = calculatePreciseArea(geojson);
  
  // Step 6: Extract coordinates and metadata
  const metadata = extractMetadata(extractedFiles);
  
  // Step 7: Update UI
  updateGeospatialDisplay({
    area: area,
    coordinates: geojson.coordinates,
    metadata: metadata,
    filename: files[0].name
  });
  
  // Step 8: Trigger ecological data fetch
  fetchEcologicalData(geojson, area);
}