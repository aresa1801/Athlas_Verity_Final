import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Google Drive upload is temporarily disabled for preview support",
      message: "PDF download is still available locally",
    },
    { status: 503 },
  )

  /* 
  try {
    const formData = await request.formData()
    const pdfFile = formData.get("pdf") as File
    const fileName = formData.get("fileName") as string
    const projectName = formData.get("projectName") as string

    if (!process.env.GOOGLE_DRIVE_CREDENTIALS) {
      console.error("[v0] Missing GOOGLE_DRIVE_CREDENTIALS environment variable")
      return NextResponse.json({ error: "Google Drive credentials not configured" }, { status: 500 })
    }

    if (!pdfFile || !fileName) {
      console.error("[v0] Missing required fields: pdf or fileName")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS)
    const folderId = "1jCJNzW7BGFkBBGIC78ScxMoOqsHaN7rl"

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: credentials.type,
        project_id: credentials.project_id,
        private_key_id: credentials.private_key_id,
        private_key: credentials.private_key?.replace(/\\n/g, "\n"),
        client_email: credentials.client_email,
        client_id: credentials.client_id,
        auth_uri: credentials.auth_uri,
        token_uri: credentials.token_uri,
        auth_provider_x509_cert_url: credentials.auth_provider_x509_cert_url,
        client_x509_cert_url: credentials.client_x509_cert_url,
      },
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    })

    const drive = google.drive({ version: "v3", auth })

    const pdfBuffer = await pdfFile.arrayBuffer()
    console.log("[v0] PDF buffer created, size:", pdfBuffer.byteLength, "bytes")

    const fileMetadata = {
      name: fileName,
      mimeType: "application/pdf",
      parents: [folderId],
    }

    const media = {
      mimeType: "application/pdf",
      body: Buffer.from(pdfBuffer),
    }

    console.log("[v0] Starting Google Drive upload for:", fileName)

    const response = await drive.files.create({
      requestBody: fileMetadata as any,
      media: media as any,
      fields: "id, webViewLink, name",
    })

    console.log("[v0] Google Drive upload successful, file ID:", response.data.id)

    return NextResponse.json({
      success: true,
      fileId: response.data.id,
      fileLink: response.data.webViewLink,
      fileName: response.data.name,
      message: "PDF uploaded successfully to Google Drive",
    })
  } catch (error) {
    console.error("[v0] Google Drive upload error:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Full error details:", error)
    return NextResponse.json(
      {
        error: "Failed to upload PDF to Google Drive",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
  */
}
