/** Resolve a scalar/list data type to a readable string. */
export function resolveDataType(dt: Record<string, unknown>): string {
  if (dt.listType) {
    const inner = dt.listType as Record<string, unknown>;
    return `List<${(inner.scalarType as string) || "unknown"}>`;
  }
  if (dt.scalarType === "DataStruct") {
    const sub = dt.subType as Record<string, unknown> | undefined;
    const dsi = sub?.dataStructIdentifier as Record<string, unknown> | undefined;
    return dsi?.name ? `DataStruct:${dsi.name}` : "DataStruct";
  }
  if (dt.enumType) {
    const en = dt.enumType as Record<string, unknown>;
    const eid = en.enumIdentifier as Record<string, unknown> | undefined;
    return eid?.name ? `Enum:${eid.name}` : "Enum";
  }
  return (dt.scalarType as string) || "unknown";
}
