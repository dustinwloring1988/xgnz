const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Ollama tags request failed: ${res.status} ${res.statusText} ${body}`)
    }

    const data = await res.json()
    const models: string[] = Array.isArray(data?.models)
      ? data.models
          .map((m: any) => (typeof m?.name === "string" ? m.name : ""))
          .filter((n: string) => n.length > 0)
      : []

    return Response.json({ models }, { status: 200 })
  } catch (error) {
    console.error("Models API error:", error)
    return Response.json({ models: [] }, { status: 500 })
  }
}

