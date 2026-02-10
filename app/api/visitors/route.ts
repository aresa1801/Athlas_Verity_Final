import { headers } from "next/headers"

// Redis helper functions
async function executeRedisCommand(command: string[], redisUrl: string, redisToken: string) {
  const response = await fetch(`${redisUrl}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  })

  if (!response.ok) return null
  const data = await response.json()
  return data
}

async function getFromRedis(key: string, redisUrl: string, redisToken: string) {
  const response = await fetch(`${redisUrl}/get/${key}`, {
    headers: {
      Authorization: `Bearer ${redisToken}`,
    },
  })

  if (!response.ok) return null

  const data = await response.json()
  return data.result ? JSON.parse(data.result) : null
}

async function setToRedis(
  key: string,
  value: any,
  redisUrl: string,
  redisToken: string,
  exSeconds: number = 30 * 24 * 60 * 60,
) {
  const response = await fetch(`${redisUrl}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ex: exSeconds,
      nx: false,
      get: false,
      value: JSON.stringify(value),
    }),
  })

  return response.ok
}

export async function POST() {
  try {
    const headersList = await headers()

    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "unknown"

    const redisUrl = process.env.KV_REST_API_URL
    const redisToken = process.env.KV_REST_API_TOKEN

    if (!redisUrl || !redisToken) {
      return Response.json(
        { error: "Redis not configured" },
        { status: 500 },
      )
    }

    const now = Date.now()
    const visitorKey = `visitor:${ip}`

    // Get existing visitor record
    let visitorData = await getFromRedis(visitorKey, redisUrl, redisToken)

    if (!visitorData) {
      visitorData = { timestamp: now, visits: 1, lastSeen: now }
    } else {
      // Ensure visits is a number
      const currentVisits = typeof visitorData.visits === 'number' ? visitorData.visits : 1
      visitorData.visits = currentVisits + 1
      visitorData.timestamp = now
      visitorData.lastSeen = now
    }

    // Store updated visitor data
    await setToRedis(visitorKey, visitorData, redisUrl, redisToken)

    console.log("[v0] Visitor tracked:", ip, "Visits:", visitorData.visits, "Timestamp:", visitorData.timestamp)

    return Response.json({
      success: true,
      ip,
      visits: visitorData.visits,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error tracking visitor:", error)
    return Response.json(
      { error: "Failed to track visitor" },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const redisUrl = process.env.KV_REST_API_URL
    const redisToken = process.env.KV_REST_API_TOKEN

    if (!redisUrl || !redisToken) {
      return Response.json({
        today: 0,
        total: 0,
        timestamp: new Date().toISOString(),
      })
    }

    const now = Date.now()
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000
    const cacheKey = "visitor_stats_cache"

    // Check cache first (10-second cache to reduce Redis load)
    const cachedStats = await getFromRedis(cacheKey, redisUrl, redisToken)
    if (cachedStats && (now - cachedStats.calculatedAt < 10000)) {
      return Response.json({
        today: cachedStats.today,
        total: cachedStats.total,
        timestamp: new Date().toISOString(),
        cached: true,
      })
    }

    // Get all visitor keys efficiently
    const keysResponse = await fetch(`${redisUrl}/keys/visitor:*`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    })

    let today = 0
    let total = 0

    if (keysResponse.ok) {
      const keysData = await keysResponse.json()
      if (keysData.result && Array.isArray(keysData.result)) {
        total = keysData.result.length

        // Batch fetch all visitor data using MGET pattern
        // Split into chunks of 100 to avoid overwhelming Redis
        const chunkSize = 100
        for (let i = 0; i < keysData.result.length; i += chunkSize) {
          const chunk = keysData.result.slice(i, i + chunkSize)

          for (const key of chunk) {
            try {
              const visitorData = await getFromRedis(key, redisUrl, redisToken)

              if (visitorData) {
                // Check lastSeen first, then timestamp
                const checkTime = visitorData.lastSeen ?? visitorData.timestamp ?? 0

                if (typeof checkTime === 'number' && checkTime > twentyFourHoursAgo) {
                  today += 1
                } else if (typeof checkTime === 'string') {
                  const timeValue = parseInt(checkTime, 10)
                  if (!isNaN(timeValue) && timeValue > twentyFourHoursAgo) {
                    today += 1
                  }
                }
              }
            } catch (e) {
              // Skip individual fetch errors
              continue
            }
          }
        }
      }
    }

    // Cache the results for 10 seconds
    await setToRedis(
      cacheKey,
      { today, total, calculatedAt: now },
      redisUrl,
      redisToken,
      10,
    )

    return Response.json({
      today,
      total,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error fetching visitor stats:", error)

    // Return cached data if available, even if stale
    const redisUrl = process.env.KV_REST_API_URL
    const redisToken = process.env.KV_REST_API_TOKEN
    if (redisUrl && redisToken) {
      const cachedStats = await getFromRedis("visitor_stats_cache", redisUrl, redisToken)
      if (cachedStats) {
        return Response.json({
          today: cachedStats.today,
          total: cachedStats.total,
          timestamp: new Date().toISOString(),
          cached: true,
          stale: true,
        })
      }
    }

    return Response.json(
      {
        today: 0,
        total: 0,
        error: "Failed to fetch visitor stats",
      },
      { status: 500 },
    )
  }
}
