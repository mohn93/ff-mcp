# Agent Doc Discoverability Design

**Date:** 2026-02-19
**Problem:** AI agents connecting to the FF MCP can edit YAML without ever consulting documentation, leading to semantic errors (wrong field names, missing required fields, incorrect enum values) that validation alone doesn't catch.

## Solution: Three-Layer Guidance

### Layer 1: New `get_editing_guide` Tool

A workflow-routing tool that takes a natural language task description and returns the correct workflow steps, relevant YAML docs, and critical rules.

**Description (what agents see):**
> Get the recommended workflow and relevant documentation for a FlutterFlow editing task. Call this BEFORE modifying any YAML. Describe what you want to do (e.g. 'change button color', 'add a TextField to the login page', 'create a reusable header component') and receive the correct workflow steps, YAML schemas, and critical rules.

**Parameters:**
- `task` (required string) — Natural language description of the editing task
- `projectId` (optional string) — For context in workflow steps

**Logic:**
1. Parse task for keywords → match against TOPIC_MAP to find relevant docs
2. Detect edit type from keywords: edit-existing, add-widget, create-component, configure-project
3. Return combined response: workflow steps + relevant doc content + universal rules

### Layer 2: Updated Tool Descriptions

**`validate_yaml`** — append:
> Tip: Call get_editing_guide or get_yaml_docs BEFORE writing YAML to understand the correct schema and field names. Validation catches syntax errors but not semantic mistakes.

**`update_project_yaml`** — append:
> For best results, call get_editing_guide before writing YAML to get the correct workflow and schema documentation.

### Layer 3: Response Hints in `validate_yaml`

On validation **failure**: append hint with the relevant widget type doc suggestion, extracted from the fileKey.

On validation **success**: no extra output.

## Files to Create/Modify

- `src/tools/get-editing-guide.ts` — New tool
- `src/tools/validate-yaml.ts` — Updated description + response hints
- `src/tools/update-yaml.ts` — Updated description
- `src/index.ts` — Register new tool
- `src/__tests__/get-editing-guide.test.ts` — Tests
- `CLAUDE.md` — Add tool to table
