import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = process.cwd();
const ignored = new Set(["node_modules", ".git", ".expo", "coverage"]);
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) files.push(path);
  }
}
await walk(root);
const transitionInventory = JSON.parse(
  await readFile(
    join(root, "src/features/legacy/transition-inventory.json"),
    "utf8",
  ),
);
const oversizedInventoryPath = "scripts/legacy-oversized-files.json";
const oversizedInventory = JSON.parse(
  await readFile(join(root, oversizedInventoryPath), "utf8"),
);
const oversizedEntries = new Map(
  oversizedInventory.entries.map((entry) => [entry.path, entry]),
);
const changedPaths = new Set(
  execFileSync("git", ["status", "--porcelain=v1"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim().split(" -> ").at(-1)),
);
const transitionalAdapters = new Set(
  transitionInventory.adapters.map((entry) => entry.path),
);
const allowedRawFetch = new Set([
  "src/core/api/client.ts",
  ...transitionalAdapters,
]);
const screenLineLimit = 800;
const functionLineLimit = 100;
const failures = [];
if (!/^\d{4}-\d{2}-\d{2}$/.test(oversizedInventory.recorded_on))
  failures.push(`${oversizedInventoryPath}: recorded_on must be ISO-8601 date`);
for (const file of files) {
  const path = relative(root, file);
  if (
    path.includes("/__tests__/") ||
    path.startsWith("scripts/") ||
    path.startsWith("contracts/") ||
    path.endsWith(".generated.ts")
  )
    continue;
  const source = await readFile(file, "utf8");
  const lineCount = source.split("\n").length;
  const isTouched = [...changedPaths].some(
    (changed) => path === changed || path.startsWith(`${changed}/`),
  );
  const inventoryEntry = oversizedEntries.get(path);
  if (lineCount > screenLineLimit && !inventoryEntry)
    failures.push(
      `${path}: ${lineCount} lines exceeds ${screenLineLimit}; split it instead of adding legacy debt`,
    );
  if (inventoryEntry && lineCount > inventoryEntry.baseline_lines)
    failures.push(
      `${path}: grew from legacy baseline ${inventoryEntry.baseline_lines} to ${lineCount} lines`,
    );
  if (changedPaths.has(path) && lineCount > screenLineLimit && !inventoryEntry)
    failures.push(
      `${path}: touched files must remain at or under ${screenLineLimit} lines`,
    );
  const isModernFeature =
    path.startsWith("src/features/home/") ||
    path.startsWith("src/features/conversations/");
  if (isTouched && isModernFeature) {
    source.split("\n").forEach((line, index) => {
      const trimmed = line.trim();
      const allowedLongDeclaration =
        trimmed.startsWith("import ") || trimmed.startsWith("export type ");
      if (line.length > 100 && !allowedLongDeclaration)
        failures.push(
          `${path}:${index + 1}: modern feature lines must stay at or under 100 characters`,
        );
      if (!trimmed.startsWith("for ") && (trimmed.match(/;/g) || []).length > 1)
        failures.push(
          `${path}:${index + 1}: split multiple statements onto separate lines`,
        );
    });
    const tree = ts.createSourceFile(
      path,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const checkFunctions = (node) => {
      if (ts.isFunctionLike(node)) {
        const start =
          tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
        const end = tree.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
        if (end - start + 1 > functionLineLimit)
          failures.push(
            `${path}:${start}: function is ${end - start + 1} lines; split it below ${functionLineLimit}`,
          );
      }
      ts.forEachChild(node, checkFunctions);
    };
    checkFunctions(tree);
  }
  if (
    path === "app/screens/HomeScreen.tsx" &&
    source.split("\n").length > screenLineLimit
  ) {
    failures.push(
      `${path}: Home route must stay under ${screenLineLimit} lines; extract a feature container.`,
    );
  }
  const hasLegacyNetwork =
    /\bfetch\(/.test(source) || /\/api\/v1\b/.test(source);
  if (hasLegacyNetwork && !allowedRawFetch.has(path))
    failures.push(
      `${path}: network access must use the central client or an enumerated transitional adapter`,
    );
  if (
    /AsyncStorage\.(?:setItem|multiSet)\([^\n]*(?:draft|answer|review|password|session_id)/i.test(
      source,
    )
  )
    failures.push(
      `${path}: sensitive workflow state must not be plaintext AsyncStorage`,
    );
  if (
    /body\s*:\s*JSON\.stringify\([\s\S]{0,300}\b(?:uid|userId)\s*:/.test(source)
  )
    failures.push(`${path}: client-supplied user identity in request payload`);
}
for (const entry of oversizedInventory.entries) {
  if (!files.some((file) => relative(root, file) === entry.path))
    failures.push(
      `${entry.path}: legacy inventory entry no longer exists; remove the entry when deleting the file`,
    );
}
try {
  const baseline = JSON.parse(
    execFileSync("git", ["show", `HEAD:${oversizedInventoryPath}`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  const prior = new Map(baseline.entries.map((entry) => [entry.path, entry]));
  for (const [path, entry] of oversizedEntries) {
    const old = prior.get(path);
    if (!old)
      failures.push(
        `${path}: new legacy oversized-file inventory entries are forbidden`,
      );
    else if (entry.baseline_lines > old.baseline_lines)
      failures.push(`${path}: legacy baseline cannot increase`);
  }
} catch {
  // First introduction of the dated inventory: its entries form the initial baseline.
}
for (const adapter of transitionalAdapters) {
  if (!files.some((file) => relative(root, file) === adapter))
    failures.push(`${adapter}: listed transitional adapter is missing`);
}
if (failures.length) {
  console.error("Architecture gate failed:\n" + failures.join("\n"));
  process.exit(1);
}
console.log(
  `Architecture gate passed (${files.length} files scanned; ${oversizedEntries.size} dated legacy oversized files; ${transitionalAdapters.size} transitional adapters expire ${transitionInventory.removal_deadline}).`,
);
