import { headers } from "next/headers"

export async function GET() {
  try {
    const headersList = await headers()

    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "unknown"

    const now = Date.now()
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000

    // Use Upstash Redis for persistent storage
    const redisUrl = process.env.KV_REST_API_URL
    const redisToken = process.env.KV_REST_API_TOKEN

    if (!redisUrl || !redisToken) {
      console.warn("[v0] Redis credentials not configured, using fallback mode")
      return Response.json({
        todaysVisitors: 0,
        totalVisitors: 0,
        timestamp: new Date().toISOString(),
        mode: "fallback",
      })
    }

    // Get visitor record from Redis
    const visitorKey = `visitor:${ip}`
    const visitorDataResponse = await fetch(`${redisUrl}/get/${visitorKey}`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    })

    let visitorData = { timestamp: now, visits: 1 }

    if (visitorDataResponse.ok) {
      const data = await visitorDataResponse.json()
      if (data.result) {
        try {
          visitorData = JSON.parse(data.result)
          visitorData.visits += 1
          visitorData.timestamp = now
        } catch {
          visitorData = { timestamp: now, visits: 1 }
        }
      }
    } else {
      // New visitor
      visitorData = { timestamp: now, visits: 1 }
    }

    // Store updated visitor data in Redis (30-day expiry)
    const storeResponse = await fetch(`${redisUrl}/set/${visitorKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ex: 30 * 24 * 60 * 60,
        nx: false,
        get: false,
        value: JSON.stringify(visitorData),
      }),
    })

    if (!storeResponse.ok) {
      console.warn("[v0] Failed to store visitor data in Redis:", storeResponse.statusText)
    }

    // Get all visitors from Redis
    const keysResponse = await fetch(
      `${redisUrl}/keys/visitor:*`,
      {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      },
    )

    let todaysVisitors = 0
    let totalVisitors = 0

    if (keysResponse.ok) {
      const keysData = await keysResponse.json()
      if (keysData.result && Array.isArray(keysData.result)) {
        totalVisitors = keysData.result.length

        // Count today's visitors
        for (const key of keysData.result) {
          const vResponse = await fetch(`${redisUrl}/get/${key}`, {
            headers: {
              Authorization: `Bearer ${redisToken}`,
            },
          })

          if (vResponse.ok) {
            const vData = await vResponse.json()
            if (vData.result) {
              try {
                const parsed = JSON.parse(vData.result)
                const timestamp = typeof parsed.timestamp === 'string' 
                  ? parseInt(parsed.timestamp, 10) 
                  : parsed.timestamp
                
                if (!isNaN(timestamp) && timestamp > twentyFourHoursAgo) {
                  todaysVisitors += 1
                }
              } catch (e) {
                console.warn("[v0] Failed to parse visitor record:", key, e)
              }
            }
          }
        }
      }
    }

    console.log(
      "[v0] Visitor Stats (Redis) - Today:",
      todaysVisitors,
      "Total:",
      totalVisitors,
      "IP:",
      ip,
    )

    return Response.json({
      todaysVisitors,
      totalVisitors,
      timestamp: new Date().toISOString(),
      ipCount: totalVisitors,
      mode: "redis-persistent",
    })
  } catch (error) {
    console.error("[v0] Error in visitor analytics:", error)

    return Response.json(
      {
        todaysVisitors: 0,
        totalVisitors: 0,
        timestamp: new Date().toISOString(),
        error: "Failed to fetch visitor stats",
        mode: "error",
      },
      { status: 500 },
    )
  }
}
