/**
 * Extract function metadata from CompScript function files
 * Uses simple evaluation to extract function definitions - KISS principle!
 */

import * as fs from "fs";
import * as path from "path";
import * as vm from "vm";

interface FunctionMetadata {
  name: string;
  docs?: string;
  args: Array<{
    name: string;
    type: string;
    canBeExternal?: boolean;
    defaultValue?: any;
    repeated?: boolean;
    nullable?: boolean;
    docs?: string;
  }>;
  outputType: string;
  genericParams?: string[];
}

export function extractFunctionMetadata(basePath: string): FunctionMetadata[] {
  const functions: FunctionMetadata[] = [];
  const functionsDir = path.join(basePath, "functions");

  if (!fs.existsSync(functionsDir)) {
    return functions;
  }

  // List of function files
  const functionFiles = [
    "array.js",
    "boolean.js",
    "cluster.js",
    "display.js",
    "events.js",
    "groups.js",
    "help.js",
    "math.js",
    "persons.js",
    "sheets.js",
    "staff.js",
    "stream.js",
    "table.js",
    "time.js",
    "tuple.js",
    "udf.js",
    "util.js",
    "wcif.js",
  ];

  for (const file of functionFiles) {
    const filePath = path.join(functionsDir, file);
    if (fs.existsSync(filePath)) {
      try {
        const extracted = extractFromFile(filePath);
        functions.push(...extracted);
      } catch (error) {
        // Silently skip files that can't be loaded
        console.error(`Error reading ${file}:`, error);
      }
    }
  }

  return functions;
}

function extractFromFile(filePath: string): FunctionMetadata[] {
  const functions: FunctionMetadata[] = [];
  const content = fs.readFileSync(filePath, "utf-8");

  // Wrap content to provide stubs for all require() calls
  const wrappedContent = `
    (function() {
      const module = { exports: {} };
      const exports = module.exports;
      
      // Stub common dependencies
      const require = function(name) {
        if (name === 'luxon') return { DateTime: class DateTime {} };
        if (name.startsWith('./../attempt_result') || name.startsWith('./attempt_result')) {
          return { AttemptResult: class AttemptResult { constructor() {} } };
        }
        if (name.startsWith('.')) return {};
        return {};
      };
      
      ${content}
      
      return module.exports;
    })();
  `;

  try {
    const sandbox = {
      console: { log: () => {}, error: () => {} },
      process: { env: {} },
    };

    vm.createContext(sandbox);
    const result = vm.runInContext(wrappedContent, sandbox, { timeout: 1000 });

    // Extract the exported functions
    const exported = result?.functions || [];

    for (const func of exported) {
      if (func && func.name && func.outputType) {
        // Create clean metadata object without implementation
        const metadata: FunctionMetadata = {
          name: func.name,
          outputType: func.outputType,
          args: (func.args || []).map((arg: any) => ({
            name: arg.name,
            type: arg.type,
            canBeExternal: arg.canBeExternal,
            defaultValue: arg.defaultValue,
            repeated: arg.repeated,
            nullable: arg.nullable,
            docs: arg.docs,
          })),
        };

        if (func.docs) {
          metadata.docs = func.docs;
        }

        if (func.genericParams) {
          metadata.genericParams = func.genericParams;
        }

        functions.push(metadata);
      }
    }
  } catch (error) {
    // If evaluation fails, return empty array
    console.error(`Failed to evaluate ${filePath}:`, error);
  }

  return functions;
}
