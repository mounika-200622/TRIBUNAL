import { extractClaims } from "@/lib/agents/extract";
import { searchEvidence } from "@/lib/retrieval/search";
import { disagreementOf, runPanel } from "@/lib/agents/advocate";
import { judgeClaim, trustScore } from "@/lib/agents/judge";
import { hasGroq } from "@/lib/config";
import type { Claim, StreamEvent } from "@/lib/types";

/**
 * Runs the tribunal and streams every step as it happens.
 *
 * Claims are tried in parallel — each one's retrieval, panel, and ruling run
 * independently, so a slow source fetch on claim 3 never holds up claim 1's
 * verdict. Events emit the instant they're true, which is what lets the graph
 * assemble itself live instead of appearing all at once at the end.
 */

export const maxDuration = 60;

export async function POST(req: Request) {
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };

  if (!text || text.trim().length < 20) {
    return Response.json(
      { error: "Paste at least a sentence or two to put on trial." },
      { status: 400 },
    );
  }
  if (!hasGroq) {
    return Response.json({ error: "GROQ_API_KEY is not configured." }, { status: 503 });
  }

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
        } catch {
          // Client hung up; the trial just finishes unobserved.
        }
      };

      try {
        const claims = await extractClaims(text.slice(0, 6000));

        if (claims.length === 0) {
          send({
            type: "error",
            message: "No checkable factual claims found. Try text that makes specific assertions.",
          });
          controller.close();
          return;
        }

        send({ type: "claims", claims });

        // Each claim runs its own full trial; all trials run at once.
        const tried = await Promise.all(
          claims.map(async (claim): Promise<Claim> => {
            send({ type: "claim_status", claimId: claim.id, status: "retrieving" });

            const sources = await searchEvidence(claim.text);
            // Namespace source ids so two claims can't collide in the graph.
            const owned = sources.map((s) => ({ ...s, id: `${claim.id}-${s.id}` }));
            for (const source of owned) send({ type: "source", claimId: claim.id, source });

            const withSources: Claim = { ...claim, sources: owned };

            send({ type: "claim_status", claimId: claim.id, status: "arguing" });
            const args = await runPanel(withSources, (a) =>
              send({ type: "argument", claimId: claim.id, argument: a }),
            );

            send({ type: "claim_status", claimId: claim.id, status: "judging" });
            const ruling = await judgeClaim(withSources, args);
            const disagreement = disagreementOf(args);

            send({
              type: "verdict",
              claimId: claim.id,
              verdict: ruling.verdict,
              confidence: ruling.confidence,
              failureType: ruling.failureType,
              reasoning: ruling.reasoning,
              disagreement,
            });

            return {
              ...withSources,
              status: "done",
              arguments: args,
              verdict: ruling.verdict,
              confidence: ruling.confidence,
              failureType: ruling.failureType,
              reasoning: ruling.reasoning,
              disagreement,
            };
          }),
        );

        send({ type: "done", trustScore: trustScore(tried) });
      } catch (e) {
        console.error("tribunal failed:", e);
        send({ type: "error", message: "The tribunal hit an error. Try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
