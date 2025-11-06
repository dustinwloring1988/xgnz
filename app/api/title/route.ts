const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    const userPrompt = String(prompt || "").slice(0, 400)

    const instruction =
      "Create a very short, concise chat title of 3–5 words for the following user message. Never exceed 5 words. Return ONLY the title without quotes or trailing punctuation."

    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:latest",
        stream: false,
        messages: [
          { role: "system", content: instruction },
          { role: "user", content: userPrompt },
        ],
        options: { temperature: 0.3, num_predict: 64 },
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Ollama title request failed: ${res.status} ${res.statusText} ${body}`)
    }

    const data = await res.json()
    let title: string = data?.message?.content || "New Chat"
    title = title.trim().replace(/^"|"$/g, "").replace(/[\s\u00A0]+/g, " ")
    title = title.replace(/[\.!?\-–—]+$/g, "").trim()

    if (!title) title = "New Chat"

    return Response.json({ title })
  } catch (error) {
    console.error("Title API error:", error)
    return Response.json({ error: "Failed to generate title" }, { status: 500 })
  }
}
