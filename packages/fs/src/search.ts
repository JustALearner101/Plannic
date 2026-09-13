import path from "node:path";
import Fuse from "fuse.js";
import type { SearchResult, DocType } from "@plannic/core";
import { listPlans, readPlan } from "./reader.js";

interface SearchableItem {
  slug: string;
  planName: string;
  docType: DocType;
  documentFile: string;
  body: string;
  tags: string[];
}

export async function searchPlans(
  cwd: string,
  query: string,
  limit = 5
): Promise<SearchResult[]> {
  const summaries = await listPlans(cwd);
  const items: SearchableItem[] = [];

  for (const summary of summaries) {
    const plan = await readPlan(cwd, summary.slug);
    if (!plan) continue;

    for (const doc of plan.documents) {
      items.push({
        slug: plan.slug,
        planName: summary.name,
        docType: doc.type,
        documentFile: path.basename(doc.path),
        body: doc.body,
        tags: doc.frontmatter.tags ?? [],
      });
    }
  }

  if (items.length === 0) {
    return [];
  }

  const fuse = new Fuse(items, {
    keys: [
      { name: "planName", weight: 0.4 },
      { name: "tags", weight: 0.3 },
      { name: "docType", weight: 0.1 },
      { name: "body", weight: 0.2 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  const searchResults = fuse.search(query, { limit });

  return searchResults.map((res) => {
    // Generate excerpt from body around query match or first 120 chars
    const body = res.item.body;
    const lowerBody = body.toLowerCase();
    const queryIdx = lowerBody.indexOf(query.toLowerCase());
    let excerpt = "";

    if (queryIdx !== -1) {
      const start = Math.max(0, queryIdx - 40);
      const end = Math.min(body.length, queryIdx + 80);
      excerpt = (start > 0 ? "..." : "") + body.slice(start, end).replace(/\n+/g, " ") + (end < body.length ? "..." : "");
    } else {
      excerpt = body.slice(0, 100).replace(/\n+/g, " ") + (body.length > 100 ? "..." : "");
    }

    return {
      slug: res.item.slug,
      planName: res.item.planName,
      docType: res.item.docType,
      documentFile: res.item.documentFile,
      score: res.score ?? 0,
      excerpt: excerpt.trim(),
    };
  });
}
