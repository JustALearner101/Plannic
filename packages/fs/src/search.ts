import path from "node:path";
import Fuse from "fuse.js";
import type { SearchResult, DocType } from "@plannic/core";
import { listPlans, readPlan, listAdrs, readAdr, listSpecs, readSpec } from "./reader.js";

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

  const planItems = await Promise.all(summaries.map(async (summary) => {
    const plan = await readPlan(cwd, summary.slug);
    if (!plan) return [] as SearchableItem[];
    return plan.documents.map((doc) => ({
      slug: plan.slug,
      planName: summary.name,
      docType: doc.type,
      documentFile: path.basename(doc.path),
      body: doc.body,
      tags: doc.frontmatter.tags ?? [],
    }));
  }));
  items.push(...planItems.flat());
  // Index ADRs
  const adrSummaries = await listAdrs(cwd);
  const adrItems = await Promise.all(adrSummaries.map(async (adrSummary) => {
    const adr = await readAdr(cwd, adrSummary.number);
    if (!adr) return null;
    return {
      slug: adr.slug,
      planName: `ADR ${adr.number}: ${adr.frontmatter.title}`,
      docType: "adr",
      documentFile: path.basename(adr.path),
      body: adr.body,
      tags: adr.frontmatter.tags ?? [],
    };
  }));
  items.push(...adrItems.filter((item): item is SearchableItem => item !== null));

  // Index Specs
  const specSummaries = await listSpecs(cwd);
  const specItems = await Promise.all(specSummaries.map(async (specSummary) => {
    const spec = await readSpec(cwd, specSummary.slug);
    if (!spec) return null;
    return {
      slug: spec.slug,
      planName: `Spec: ${spec.frontmatter.title}`,
      docType: "spec",
      documentFile: path.basename(spec.path),
      body: spec.body,
      tags: spec.frontmatter.tags ?? [],
    };
  }));
  items.push(...specItems.filter((item): item is SearchableItem => item !== null));

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
    ignoreLocation: true,
    minMatchCharLength: 2,
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
