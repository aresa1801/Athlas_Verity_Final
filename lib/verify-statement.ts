async function verifyStatement(statementFile, projectData) {
  // Extract text from PDF/image using OCR if needed
  const statementText = await extractTextFromFile(statementFile);
  
  const verificationPrompt = `
    Verify this Statement of Data Truth against project data:
    
    Statement Text: "${statementText}"
    
    Project Data:
    - Project Name: ${projectData.name}
    - Location: ${projectData.location}
    - Area: ${projectData.area}
    - Forest Type: ${projectData.forestType}
    - Developer: ${projectData.organization}
    
    Tasks:
    1. Verify signatory matches project developer
    2. Check date is within acceptable range (not older than 6 months)
    3. Verify area mentioned matches calculated area (±5%)
    4. Check location matches project coordinates
    5. Verify all required statements are present
    
    Return:
    - signatory_valid: boolean
    - date_valid: boolean
    - area_match: boolean (and difference %)
    - location_match: boolean
    - completeness: percentage
    - overall_confidence: percentage
    - issues_found: array of string
    - recommendation: "approve" | "review" | "reject"
  `;
  
  const result = await geminiModel.generateContent(verificationPrompt);
  return JSON.parse(result.response.text());
}