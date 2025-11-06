const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"

export async function POST(request: Request) {
  try {
    const { messages, model } = await request.json()

    const selectedModel = model || "gemma3:latest"
    const mappedMessages = Array.isArray(messages)
      ? messages.map((m: any) => ({ role: m.role, content: m.content }))
      : []

    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        messages: mappedMessages,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 1024,
        },
      }),
    })

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "")
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText} ${body}`)
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader()
        let buffer = ""
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed) continue
              try {
                const json = JSON.parse(trimmed)
                if (json?.message?.content) {
                  const out = JSON.stringify({ type: "delta", content: json.message.content }) + "\n"
                  controller.enqueue(encoder.encode(out))
                }
                if (json?.done) {
                  // flush any remaining buffer
                  if (buffer) {
                    try {
                      const j = JSON.parse(buffer)
                      if (j?.message?.content) {
                        const out = JSON.stringify({ type: "delta", content: j.message.content }) + "\n"
                        controller.enqueue(encoder.encode(out))
                      }
                    } catch {}
                  }
                  // signal done
                  controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"))
                  controller.close()
                  return
                }
              } catch {
                // If not JSON, ignore
              }
            }
          }
          // close if reader finished
          controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return Response.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
