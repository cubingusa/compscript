const fs = require("fs");
const path = require("path");

// Test direct file reading
const mathFile = fs.readFileSync(
  path.join(__dirname, "../functions/math.js"),
  "utf-8"
);

console.log("File length:", mathFile.length);

// Test const pattern
const constMatches = [...mathFile.matchAll(/^const\s+(\w+)\s*=\s*\{/gm)];
console.log("Found", constMatches.length, "const definitions");
console.log(
  "First 3:",
  constMatches.slice(0, 3).map((m) => m[1])
);

// Test exports pattern
const exportsMatch = mathFile.match(/functions:\s*\[([\s\S]+?)\]/);
console.log("\\nExports match:", !!exportsMatch);
if (exportsMatch) {
  const names = exportsMatch[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);
  console.log("Exported count:", names.length);
  console.log("First 3:", names.slice(0, 3));
}

// Now test the actual extractor
const { extractFunctionMetadata } = require("./out/functionExtractor");
const funcs = extractFunctionMetadata("..");
console.log("\\nExtracted:", funcs.length, "functions");
if (funcs.length > 0) {
  console.log("First 3:");
  funcs.slice(0, 3).forEach((f) => console.log(" -", f.name));
}
