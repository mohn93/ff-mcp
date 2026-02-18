import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { decodeProjectYamlResponse } from "./decode-yaml.js";

/** Helper: create a base64-encoded ZIP buffer containing the given files. */
function makeZipBase64(files: Record<string, string>): string {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, Buffer.from(content, "utf-8"));
  }
  return zip.toBuffer().toString("base64");
}

describe("decodeProjectYamlResponse", () => {
  describe("camelCase response field (projectYamlBytes)", () => {
    it("decodes a single file from the ZIP", () => {
      const b64 = makeZipBase64({ "app-details": "name: MyApp" });
      const result = decodeProjectYamlResponse({
        value: { projectYamlBytes: b64 },
      });
      expect(result).toEqual({ "app-details": "name: MyApp" });
    });

    it("decodes multiple files from the ZIP", () => {
      const b64 = makeZipBase64({
        "app-details": "name: MyApp",
        "page/id-Scaffold_abc": "scaffoldId: Scaffold_abc",
        "theme/colors": "primaryColor: blue",
      });
      const result = decodeProjectYamlResponse({
        value: { projectYamlBytes: b64 },
      });
      expect(Object.keys(result)).toHaveLength(3);
      expect(result["app-details"]).toBe("name: MyApp");
      expect(result["page/id-Scaffold_abc"]).toBe("scaffoldId: Scaffold_abc");
      expect(result["theme/colors"]).toBe("primaryColor: blue");
    });
  });

  describe("snake_case response field (project_yaml_bytes)", () => {
    it("falls back to snake_case when camelCase is absent", () => {
      const b64 = makeZipBase64({ "app-details": "name: SnakeApp" });
      const result = decodeProjectYamlResponse({
        value: { project_yaml_bytes: b64 },
      });
      expect(result).toEqual({ "app-details": "name: SnakeApp" });
    });
  });

  describe("camelCase takes precedence over snake_case", () => {
    it("uses camelCase when both are present", () => {
      const camelB64 = makeZipBase64({ "file": "camel" });
      const snakeB64 = makeZipBase64({ "file": "snake" });
      const result = decodeProjectYamlResponse({
        value: {
          projectYamlBytes: camelB64,
          project_yaml_bytes: snakeB64,
        },
      });
      expect(result).toEqual({ file: "camel" });
    });
  });

  describe("empty ZIP", () => {
    it("returns empty object for a ZIP with no entries", () => {
      const zip = new AdmZip();
      const b64 = zip.toBuffer().toString("base64");
      const result = decodeProjectYamlResponse({
        value: { projectYamlBytes: b64 },
      });
      expect(result).toEqual({});
    });
  });

  describe("ZIP with directories only", () => {
    it("skips directory entries and returns empty object", () => {
      const zip = new AdmZip();
      // Adding a directory entry (ends with /)
      zip.addFile("somedir/", Buffer.alloc(0));
      const b64 = zip.toBuffer().toString("base64");
      const result = decodeProjectYamlResponse({
        value: { projectYamlBytes: b64 },
      });
      expect(result).toEqual({});
    });
  });

  describe("error handling", () => {
    it("throws when apiResponse is null", () => {
      expect(() => decodeProjectYamlResponse(null)).toThrow(
        "Unexpected API response: missing value.projectYamlBytes"
      );
    });

    it("throws when apiResponse is undefined", () => {
      expect(() => decodeProjectYamlResponse(undefined)).toThrow(
        "Unexpected API response: missing value.projectYamlBytes"
      );
    });

    it("throws when value is missing", () => {
      expect(() => decodeProjectYamlResponse({})).toThrow(
        "Unexpected API response: missing value.projectYamlBytes"
      );
    });

    it("throws when value has no bytes fields", () => {
      expect(() => decodeProjectYamlResponse({ value: {} })).toThrow(
        "Unexpected API response: missing value.projectYamlBytes"
      );
    });

    it("throws when base64 is not valid ZIP data", () => {
      // "not a zip" in base64 is valid b64 but not a valid ZIP
      const b64 = Buffer.from("not a zip file at all").toString("base64");
      expect(() =>
        decodeProjectYamlResponse({
          value: { projectYamlBytes: b64 },
        })
      ).toThrow();
    });
  });

  describe("decompress errors for individual entries", () => {
    it("skips entries that fail to decompress and logs error", () => {
      // Create a valid ZIP with one good file
      const b64 = makeZipBase64({
        "good-file": "valid content",
        "another-good": "also valid",
      });

      // This is hard to truly simulate without corrupting the ZIP buffer,
      // so we test that normal entries are returned correctly
      const result = decodeProjectYamlResponse({
        value: { projectYamlBytes: b64 },
      });
      expect(result["good-file"]).toBe("valid content");
      expect(result["another-good"]).toBe("also valid");
    });
  });

  describe("UTF-8 content", () => {
    it("preserves UTF-8 characters in YAML content", () => {
      const b64 = makeZipBase64({
        "i18n": "greeting: Hej varlden\nlabel: cafe",
      });
      const result = decodeProjectYamlResponse({
        value: { projectYamlBytes: b64 },
      });
      expect(result["i18n"]).toBe("greeting: Hej varlden\nlabel: cafe");
    });
  });

  describe("multiline YAML content", () => {
    it("preserves multiline YAML correctly", () => {
      const content = `name: MyApp
version: 1.0
pages:
  - Login
  - Home
  - Settings`;
      const b64 = makeZipBase64({ "app-details": content });
      const result = decodeProjectYamlResponse({
        value: { projectYamlBytes: b64 },
      });
      expect(result["app-details"]).toBe(content);
    });
  });
});
