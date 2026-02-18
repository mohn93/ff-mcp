# FlutterFlow API Limitations & Issues

Issues and inconsistencies encountered while working with the FlutterFlow Project YAML API (`api.flutterflow.io/v2/`). This document is intended to be shared with the FlutterFlow team for awareness and potential fixes.

---

## 1. Disabling Conditional Nodes via API

**Problem:** When disabling a `conditionActions` block via the FlutterFlow UI, the UI creates a noop action key (a key with no corresponding action file) in the trigger chain. The disabled conditional is stored in a separate action file with a `disableAction` wrapper.

However, when pushing the same pattern via the API, the server rejects it with:

```
FlutterFlow API error 400: Failed to update project:
  .../action/id-np8noop1: File is referenced but is empty
```

The API requires all referenced action keys to have corresponding action files, while the UI allows noop keys with no files.

**Workaround:** Instead of using a separate noop key, put the `disableAction`-wrapped conditional content directly in the referenced action file. This satisfies the API's file-existence check while achieving the same disabled behavior.

**Expected behavior:** The API should accept noop action keys (keys with no action file) to match the UI's behavior when disabling conditionals.

---

## 2. `disableAction` Not Valid in Trigger Chain YAML

**Problem:** The `disableAction` field is only valid in individual action files (`action/id-*.yaml`), not in the trigger chain YAML (`trigger_actions/id-ON_INIT_STATE.yaml`). Attempting to use `disableAction` in the trigger chain results in:

```
Unknown field name 'disableAction'
```

This means conditionals (`conditionActions` blocks) in the trigger chain cannot be directly disabled — they must be replaced with an `action` reference to a disabled action file.

**Impact:** Disabling a conditional requires two coordinated changes (new action file + chain modification) rather than a single in-place change. This increases complexity and error risk for API consumers.

**Suggestion:** Allow `disableAction` as a valid field in the trigger chain YAML, wrapping `conditionActions` blocks the same way it wraps actions in action files.

---

## 3. Validation vs Push Inconsistency

**Problem:** The `validate_yaml` endpoint may return success for YAML content that the `update_project_yaml` endpoint subsequently rejects. For example:

- Validating the trigger chain YAML succeeds with a warning: `"File is referenced but is empty"` for a noop key
- Pushing the same YAML fails with a hard error: `"File is referenced but is empty"`

The validation endpoint treats missing referenced files as warnings, while the push endpoint treats them as errors.

**Expected behavior:** Validation should return the same errors that the push endpoint would return, so developers can catch issues before attempting a push.

---

## 4. Sync/Cache Does Not Include All Action Files

**Problem:** When syncing a project via the bulk YAML download endpoint, some action files created by the UI's disable mechanism are not included in the sync. For example, after disabling a conditional via the UI, the generated noop key file and the disabled conditional wrapper file may not appear in the bulk download.

**Impact:** The local cache becomes inconsistent with the server state, causing `get_project_yaml` to fail with "File not found in local cache" even after a fresh sync.

**Workaround:** Re-sync with `force: true` after UI changes. If files are still missing, they may need to be fetched individually or their content inferred from the trigger chain structure.

---

## 5. Widget Trees Must Be Pushed as Individual Node Files

**Problem:** The full page YAML file (`page/id-Scaffold_XXX`) only stores page metadata (name, description, params, scaffold key). Widget children embedded inline in this file are silently stripped by the server — no error is returned, but the widgets don't appear.

**Expected behavior:** Either accept inline widget definitions in the page YAML, or return an error when inline widgets are detected so the developer knows to use node-level files.

**Workaround:** Push widget trees as three types of files:
1. Widget tree outline (`page/id-Scaffold_XXX/page-widget-tree-outline`)
2. Parent container nodes (`node/id-Column_YYY`)
3. Individual widget nodes (`node/id-Widget_ZZZ`)

---

## 6. Large Page Buffer Errors

**Problem:** Some large pages fail with `Cannot create a Buffer larger than X bytes` during ZIP decode when fetching via the bulk YAML endpoint.

**Workaround:** Fetch node-level sub-files individually instead of the full page YAML.

**Suggestion:** Support streaming or chunked responses for large pages, or provide a pagination mechanism for large widget trees.
