import { groq } from "@/lib/groq";
import { searchLiterature } from "@/lib/literature";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
  const { hypothesis, corrections } = await req.json();

  // Build expert corrections prefix if any are stored from prior reviews
  let correctionsBlock = "";
  if (Array.isArray(corrections) && corrections.length > 0) {
    const lines = corrections
      .map((c: { step: string; correction: string }) => `- Step "${c.step}": ${c.correction}`)
      .join("\n");
    correctionsBlock = `Expert corrections from previous reviews:\n${lines}\n\nApply these corrections when generating the protocol.\n\n`;
  }

  // 1. Fetch literature (non-fatal — proceed without papers if search fails)
  let abstracts = "No literature found.";
  try {
    const papers = await searchLiterature(hypothesis);
    if (papers.length > 0) {
      abstracts = papers.slice(0, 5).map((p: any) =>
        `Title: ${p.title}\nAuthors: ${p.authors}\nYear: ${p.year}\nDOI: ${p.doi}\nAbstract: ${p.abstract || "N/A"}`
      ).join("\n\n---\n\n");
    }
  } catch (litErr) {
    console.error("Literature search failed (continuing without papers):", litErr);
  }

  // 2. Stream the full plan from Groq
  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    stream: true,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: `${correctionsBlock}You are an expert scientific experiment planner. Given a hypothesis and related literature, you:
1. First output a Literature QC block in this EXACT JSON format on its own line (no other text before it):
{"litQC": {"signal": "novel"|"similar"|"exact", "references": [{"title":"...","authors":"...","year":"...","doi":"..."}]}}

2. Then output a complete experiment plan with these sections using markdown:
## Protocol
(numbered steps, each citing a source like [Source: protocol name or paper])

## Materials
| Item | Supplier | Catalog # | Unit Price | Qty | Total |
(use real suppliers: Sigma-Aldrich, Thermo Fisher, NEB, Addgene, IDT)
Mark any unverified items as [VERIFY]

## Budget
Total cost summary with 25% institutional overhead

## Timeline
| Phase | Duration | Dependencies |

## Validation
Success criteria, controls, statistical approach

## Biosafety
 Low /  Medium /  High risk — with explanation

Be operationally realistic. Never hallucinate catalog numbers — mark as [VERIFY] if unsure.`
      },
      {
        role: "user",
        content: `Hypothesis: ${hypothesis}\n\nRelated Literature Found:\n${abstracts}`
      }
    ]
  });

  // 3. Stream response back
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    }
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
  } catch (err: any) {
    console.error("/api/analyze error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}