import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { generateComprehensivePDFHTML } from './comprehensive-pdf-template'
import { BatuahHilirPDFData } from './batuah-hilir-pdf-generator'

export async function generateComprehensivePDF(data: BatuahHilirPDFData): Promise<void> {
  try {
    console.log('[v0] Generating comprehensive PDF:', data.projectName)

    // Generate HTML template
    const htmlContent = generateComprehensivePDFHTML(data)

    // Create a container element
    const container = document.createElement('div')
    container.innerHTML = htmlContent
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '-9999px'
    container.style.width = '210mm'
    container.style.background = 'white'
    document.body.appendChild(container)

    // Wait for images and fonts to load
    await new Promise(resolve => setTimeout(resolve, 500))

    // Convert HTML to canvas with proper settings
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      windowHeight: container.scrollHeight,
    })

    // Remove container
    document.body.removeChild(container)

    // Create PDF from canvas
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Calculate dimensions
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeightInMM = pageHeight
    const position = 0

    let heightLeft = imgHeight
    let page = 0

    // Add first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeightInMM

    // Add additional pages
    while (heightLeft > 0) {
      page++
      pdf.addPage()
      const yPosition = heightLeft - imgHeight
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, yPosition, imgWidth, imgHeight)
      heightLeft -= pageHeightInMM
    }

    // Save PDF
    const fileName = `Validation-Report-${data.projectName}-${new Date().getTime()}.pdf`
    pdf.save(fileName)

    console.log('[v0] PDF saved successfully:', fileName)
  } catch (error) {
    console.error('[v0] PDF generation error:', error)
    throw error
  }
}

export function openComprehensivePDFPreview(data: BatuahHilirPDFData): void {
  try {
    const htmlContent = generateComprehensivePDFHTML(data)
    const previewWindow = window.open('', '_blank')
    if (previewWindow) {
      previewWindow.document.write(htmlContent)
      previewWindow.document.close()
      previewWindow.document.title = `Validation Report - ${data.projectName}`
    }
  } catch (error) {
    console.error('[v0] Preview generation error:', error)
  }
}
