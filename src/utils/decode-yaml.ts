import AdmZip from "adm-zip";

/**
 * Decode the base64-encoded ZIP returned by the FlutterFlow projectYamls API
 * into a map of filename → YAML text.
 *
 * The API response shape is: { value: { project_yaml_bytes: "<base64>" } }
 */
export function decodeProjectYamlResponse(
  apiResponse: unknown
): Record<string, string> {
  const resp = apiResponse as {
    value?: { project_yaml_bytes?: string };
  };

  const b64 = resp?.value?.project_yaml_bytes;
  if (!b64) {
    throw new Error(
      "Unexpected API response: missing value.project_yaml_bytes"
    );
  }

  const zipBuffer = Buffer.from(b64, "base64");
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  const result: Record<string, string> = {};
  for (const entry of entries) {
    if (!entry.isDirectory) {
      try {
        result[entry.entryName] = entry.getData().toString("utf-8");
      } catch {
        // Skip entries that fail to decompress (e.g. buffer overflow on large pages)
        console.error(`[decode-yaml] Failed to decompress entry: ${entry.entryName}`);
      }
    }
  }

  return result;
}
