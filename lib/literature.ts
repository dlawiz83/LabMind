import { tavily } from "@tavily/core";

export interface LiteraturePaper {
  title: string;
  authors: string;
  year: string;
  doi: string;
  abstract: string;
}

export async function searchLiterature(hypothesis: string): Promise<LiteraturePaper[]> {
  const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });
  const results = await client.search(
    `scientific research: ${hypothesis}`,
    { searchDepth: "advanced", maxResults: 5, includeAnswer: true }
  );

  return (results.results ?? []).map((r: any) => ({
    title: r.title ?? "Untitled",
    authors: r.author ?? "",
    year: r.published_date ? String(r.published_date).slice(0, 4) : "",
    doi: r.url ?? "",
    abstract: r.content ?? "",
  }));
}
