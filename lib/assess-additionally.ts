async function assessAdditionally(projectData) {
  const additionalityPrompt = `
    Assess additionality for this carbon project:
    
    Project Data: ${JSON.stringify(projectData)}
    Region: ${projectData.location}
    Forest Type: ${projectData.forestType}
    
    Calculate:
    1. Financial additionality:
       - Project IRR without carbon revenue
       - Project IRR with carbon revenue
       - Investment barrier analysis
    
    2. Common practice additionality:
       - Regional deforestation rate
       - Similar projects in region
       - This project's intervention
    
    3. Barrier analysis:
       - Technological barriers
       - Institutional barriers
       - Social barriers
    
    Return additionality score (0-10) and justification.
  `;
  
  const result = await geminiModel.generateContent(additionalityPrompt);
  return JSON.parse(result.response.text());
}