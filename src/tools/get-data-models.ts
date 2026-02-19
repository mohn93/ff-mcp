import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta, cacheAgeFooter, listCachedKeys } from "../utils/cache.js";
import { batchProcess } from "../utils/batch-process.js";
import { resolveDataType } from "../utils/resolve-data-type.js";

type ModelType = "structs" | "enums" | "collections" | "supabase" | "all";

interface StructModel {
  name: string;
  fields: { name: string; type: string }[];
}

interface EnumModel {
  name: string;
  values: string[];
}

interface CollectionField {
  name: string;
  type: string;
}

interface CollectionModel {
  name: string;
  parentName: string | null;
  fields: CollectionField[];
}

interface SupabaseField {
  name: string;
  type: string;
  postgresType: string | null;
  isPrimaryKey: boolean;
  isRequired: boolean;
  hasDefault: boolean;
  foreignKey: string | null;
}

interface SupabaseTable {
  name: string;
  fields: SupabaseField[];
}

async function readStructs(
  projectId: string,
  nameFilter?: string
): Promise<StructModel[]> {
  const allKeys = await listCachedKeys(projectId, "data-structs/id-");
  const topLevel = allKeys.filter((k) => /^data-structs\/id-[a-z0-9]+$/i.test(k));

  const results = await batchProcess(topLevel, 10, async (key) => {
    const content = await cacheRead(projectId, key);
    if (!content) return null;

    let doc: Record<string, unknown>;
    try {
      doc = YAML.parse(content) as Record<string, unknown>;
    } catch {
      return null;
    }

    const identifier = doc.identifier as Record<string, unknown> | undefined;
    const name = (identifier?.name as string) || "unknown";

    if (nameFilter && name.toLowerCase() !== nameFilter.toLowerCase()) return null;

    const rawFields = doc.fields as Record<string, unknown>[] | undefined;
    const fields: { name: string; type: string }[] = [];
    if (Array.isArray(rawFields)) {
      for (const f of rawFields) {
        const fId = f.identifier as Record<string, unknown> | undefined;
        const fName = (fId?.name as string) || "unknown";
        const dt = (f.dataType as Record<string, unknown>) || {};
        fields.push({ name: fName, type: resolveDataType(dt) });
      }
    }

    return { name, fields } as StructModel;
  });

  return results.filter((r): r is StructModel => r !== null);
}

async function readEnums(
  projectId: string,
  nameFilter?: string
): Promise<EnumModel[]> {
  const allKeys = await listCachedKeys(projectId, "enums/id-");
  const topLevel = allKeys.filter((k) => /^enums\/id-[a-z0-9]+$/i.test(k));

  const results = await batchProcess(topLevel, 10, async (key) => {
    const content = await cacheRead(projectId, key);
    if (!content) return null;

    let doc: Record<string, unknown>;
    try {
      doc = YAML.parse(content) as Record<string, unknown>;
    } catch {
      return null;
    }

    const identifier = doc.identifier as Record<string, unknown> | undefined;
    const name = (identifier?.name as string) || "unknown";

    if (nameFilter && name.toLowerCase() !== nameFilter.toLowerCase()) return null;

    const elements = doc.elements as Record<string, unknown>[] | undefined;
    const values: string[] = [];
    if (Array.isArray(elements)) {
      for (const el of elements) {
        const elId = el.identifier as Record<string, unknown> | undefined;
        const elName = (elId?.name as string) || "unknown";
        values.push(elName);
      }
    }

    return { name, values } as EnumModel;
  });

  return results.filter((r): r is EnumModel => r !== null);
}

async function readCollections(
  projectId: string,
  nameFilter?: string
): Promise<CollectionModel[]> {
  const allKeys = await listCachedKeys(projectId, "collections/id-");
  const topLevel = allKeys.filter((k) => /^collections\/id-[a-z0-9]+$/i.test(k));

  const results = await batchProcess(topLevel, 10, async (key) => {
    const content = await cacheRead(projectId, key);
    if (!content) return null;

    let doc: Record<string, unknown>;
    try {
      doc = YAML.parse(content) as Record<string, unknown>;
    } catch {
      return null;
    }

    const identifier = doc.identifier as Record<string, unknown> | undefined;
    const name = (identifier?.name as string) || "unknown";

    if (nameFilter && name.toLowerCase() !== nameFilter.toLowerCase()) return null;

    const parentId = doc.parentCollectionIdentifier as Record<string, unknown> | undefined;
    const parentName = parentId ? ((parentId.name as string) || null) : null;

    const rawFields = doc.fields as Record<string, Record<string, unknown>> | undefined;
    const fields: CollectionField[] = [];
    if (rawFields && typeof rawFields === "object") {
      for (const fieldVal of Object.values(rawFields)) {
        const fId = fieldVal.identifier as Record<string, unknown> | undefined;
        const fName = (fId?.name as string) || "unknown";
        const dt = (fieldVal.dataType as Record<string, unknown>) || {};

        let typeStr = resolveDataType(dt);

        if (dt.scalarType === "DocumentReference") {
          const sub = dt.subType as Record<string, unknown> | undefined;
          const colId = sub?.collectionIdentifier as Record<string, unknown> | undefined;
          if (colId?.name) {
            typeStr = `DocumentReference \u2192 ${colId.name}`;
          }
        }

        fields.push({ name: fName, type: typeStr });
      }
    }

    return { name, parentName, fields } as CollectionModel;
  });

  return results.filter((r): r is CollectionModel => r !== null);
}

async function readSupabaseTables(
  projectId: string,
  nameFilter?: string
): Promise<SupabaseTable[]> {
  const content = await cacheRead(projectId, "supabase");
  if (!content) return [];

  let doc: Record<string, unknown>;
  try {
    doc = YAML.parse(content) as Record<string, unknown>;
  } catch {
    return [];
  }

  const dbConfig = doc.databaseConfig as Record<string, unknown> | undefined;
  const tables = dbConfig?.tables as Record<string, unknown>[] | undefined;
  if (!Array.isArray(tables)) return [];

  const results: SupabaseTable[] = [];
  for (const table of tables) {
    const identifier = table.identifier as Record<string, unknown> | undefined;
    const name = (identifier?.name as string) || "unknown";

    if (nameFilter && name.toLowerCase() !== nameFilter.toLowerCase()) continue;

    const rawFields = table.fields as Record<string, unknown>[] | undefined;
    const fields: SupabaseField[] = [];
    if (Array.isArray(rawFields)) {
      for (const f of rawFields) {
        const fId = f.identifier as Record<string, unknown> | undefined;
        const fName = (fId?.name as string) || "unknown";
        const typeObj = f.type as Record<string, unknown> | undefined;
        const dt = (typeObj?.dataType as Record<string, unknown>) || {};
        fields.push({
          name: fName,
          type: resolveDataType(dt),
          postgresType: (f.postgresType as string) || null,
          isPrimaryKey: (f.isPrimaryKey as boolean) || false,
          isRequired: (f.isRequired as boolean) || false,
          hasDefault: (f.hasDefault as boolean) || false,
          foreignKey: (f.foreignKey as string) || null,
        });
      }
    }

    results.push({ name, fields });
  }

  return results;
}

function formatOutput(
  structs: StructModel[],
  enums: EnumModel[],
  collections: CollectionModel[],
  supabaseTables: SupabaseTable[],
  nameFilter?: string
): string {
  const total = structs.length + enums.length + collections.length + supabaseTables.length;

  if (total === 0) {
    if (nameFilter) return `No data models matching '${nameFilter}' found.`;
    return "No data models found in cache.";
  }

  const sections: string[] = [];
  sections.push("# Data Models");

  if (structs.length > 0) {
    sections.push("");
    sections.push(`## Data Structs (${structs.length})`);
    for (const s of structs) {
      sections.push("");
      sections.push(`### ${s.name}`);
      for (const f of s.fields) {
        sections.push(`- ${f.name}: ${f.type}`);
      }
    }
  }

  if (enums.length > 0) {
    sections.push("");
    sections.push(`## Enums (${enums.length})`);
    for (const e of enums) {
      sections.push("");
      sections.push(`### ${e.name}`);
      sections.push(`Values: ${e.values.join(", ")}`);
    }
  }

  if (collections.length > 0) {
    sections.push("");
    sections.push(`## Collections (${collections.length})`);
    for (const c of collections) {
      sections.push("");
      const suffix = c.parentName ? ` (sub-collection of ${c.parentName})` : "";
      sections.push(`### ${c.name}${suffix}`);
      for (const f of c.fields) {
        sections.push(`- ${f.name}: ${f.type}`);
      }
    }
  }

  if (supabaseTables.length > 0) {
    sections.push("");
    sections.push(`## Supabase Tables (${supabaseTables.length})`);
    for (const t of supabaseTables) {
      sections.push("");
      sections.push(`### ${t.name}`);
      for (const f of t.fields) {
        const flags: string[] = [];
        if (f.isPrimaryKey) flags.push("PK");
        if (f.isRequired) flags.push("required");
        if (f.hasDefault) flags.push("has default");
        if (f.foreignKey) flags.push(`FK \u2192 ${f.foreignKey}`);
        const pgType = f.postgresType ? ` [${f.postgresType}]` : "";
        const flagStr = flags.length > 0 ? ` (${flags.join(", ")})` : "";
        sections.push(`- ${f.name}: ${f.type}${pgType}${flagStr}`);
      }
    }
  }

  return sections.join("\n");
}

export function registerGetDataModelsTool(server: McpServer) {
  server.tool(
    "get_data_models",
    "Get data structs, enums, Firestore collections, and Supabase tables from local cache. No API calls. Run sync_project first if not cached.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      type: z
        .enum(["structs", "enums", "collections", "supabase", "all"])
        .optional()
        .default("all")
        .describe(
          "Filter by model type: structs, enums, collections, supabase, or all (default)."
        ),
      name: z
        .string()
        .optional()
        .describe(
          "Case-insensitive filter by identifier name."
        ),
    },
    async ({ projectId, type, name }) => {
      const meta = await cacheMeta(projectId);
      if (!meta) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No cache found for project "${projectId}". Run sync_project first to download the project YAML files.`,
            },
          ],
        };
      }

      const modelType = (type || "all") as ModelType;

      let structs: StructModel[] = [];
      let enums: EnumModel[] = [];
      let collections: CollectionModel[] = [];
      let supabaseTables: SupabaseTable[] = [];

      if (modelType === "all" || modelType === "structs") {
        structs = await readStructs(projectId, name);
      }
      if (modelType === "all" || modelType === "enums") {
        enums = await readEnums(projectId, name);
      }
      if (modelType === "all" || modelType === "collections") {
        collections = await readCollections(projectId, name);
      }
      if (modelType === "all" || modelType === "supabase") {
        supabaseTables = await readSupabaseTables(projectId, name);
      }

      const output = formatOutput(structs, enums, collections, supabaseTables, name);

      return {
        content: [{ type: "text" as const, text: output + cacheAgeFooter(meta) }],
      };
    }
  );
}
