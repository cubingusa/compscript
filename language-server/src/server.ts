import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  Hover,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import * as fs from "fs";
import * as path from "path";
import { extractFunctionMetadata } from "./functionExtractor";

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

// Cache for parsed grammar and functions
let parser: any = null;
let allFunctions: any[] = [];

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ["(", ",", "_"],
      },
      hoverProvider: true,
      signatureHelpProvider: {
        triggerCharacters: ["(", ","],
      },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }

  // Load parser and functions
  loadCompScriptResources();
});

function loadCompScriptResources() {
  const workspacePath = path.join(__dirname, "../..");
  const parserPath = path.join(workspacePath, "parser", "parser.js");
  const functionsPath = path.join(workspacePath, "functions", "functions.js");

  console.log("Loading CompScript resources from: " + workspacePath);

  // Try to load parser
  try {
    if (fs.existsSync(parserPath)) {
      parser = require(parserPath);
      connection.console.log("Parser loaded successfully");
    } else {
      connection.console.warn("Parser not found at: " + parserPath);
    }
  } catch (error) {
    connection.console.error("Error loading parser: " + error);
  }

  // Try to load functions - first try direct require, then fall back to extraction
  try {
    if (fs.existsSync(functionsPath)) {
      const functionsModule = require(functionsPath);
      allFunctions = functionsModule.allFunctions || [];
      connection.console.log(
        `Loaded ${allFunctions.length} functions via require`
      );
    }
  } catch (error) {
    // Direct require failed (expected - functions.js has runtime dependencies)
    // Fall back to extracting metadata from individual function files
    try {
      allFunctions = extractFunctionMetadata(workspacePath);
      connection.console.log(
        `Extracted ${allFunctions.length} function definitions from source`
      );
    } catch (extractError) {
      connection.console.error(
        "Error extracting function metadata: " + extractError
      );
      allFunctions = [];
    }
  }
}

// The content of a text document has changed
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];

  if (!parser) {
    return;
  }

  try {
    // Try to parse the document
    parser.parse(text);
  } catch (e: any) {
    // Parse error - create diagnostic
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range: {
        start: textDocument.positionAt(e.location?.start?.offset || 0),
        end: textDocument.positionAt(e.location?.end?.offset || text.length),
      },
      message: e.message || "Syntax error",
      source: "compscript",
    };

    if (hasDiagnosticRelatedInformationCapability && e.expected) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: `Expected: ${e.expected.join(", ")}`,
        },
      ];
    }

    diagnostics.push(diagnostic);
  }

  // Send the computed diagnostics to VSCode
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have changed in VSCode
  connection.console.log("We received a file change event");
});

// Helper function to determine the expected type at cursor position
function getExpectedTypeAtPosition(
  text: string,
  offset: number
): string | null {
  // Find the function call we're in
  let depth = 0;
  let functionStart = -1;

  for (let i = offset - 1; i >= 0; i--) {
    if (text[i] === ")") depth++;
    if (text[i] === "(") {
      depth--;
      if (depth < 0) {
        functionStart = i;
        break;
      }
    }
  }

  if (functionStart === -1) {
    return null;
  }

  // Find function name
  let nameEnd = functionStart;
  let nameStart = functionStart - 1;
  while (nameStart >= 0 && /[a-zA-Z0-9_]/.test(text[nameStart])) {
    nameStart--;
  }
  nameStart++;

  const functionName = text.substring(nameStart, nameEnd);
  const matchingFunction = allFunctions.find((f) => f.name === functionName);

  if (!matchingFunction || !matchingFunction.args) {
    return null;
  }

  // Calculate which parameter we're on
  let paramIndex = 0;
  depth = 0;
  for (let i = functionStart + 1; i < offset; i++) {
    if (text[i] === "(") depth++;
    if (text[i] === ")") depth--;
    if (text[i] === "," && depth === 0) paramIndex++;
  }

  const param = matchingFunction.args[paramIndex];
  return param ? param.type : null;
}

// Helper function to check if a function signature matches expected type
function functionMatchesType(
  fn: any,
  expectedType: string
): boolean {
  if (!expectedType) return true;

  // Check if expected type is a function type like "Boolean(Person)"
  const functionTypeMatch = expectedType.match(/^(\w+)\(([^)]*)\)$/);
  
  if (functionTypeMatch) {
    const [, returnType, paramTypes] = functionTypeMatch;
    const params = paramTypes ? paramTypes.split(",").map(p => p.trim()) : [];
    
    // Check if function returns the expected type
    if (fn.outputType !== returnType) {
      return false;
    }
    
    // Check if function accepts the expected parameters
    const fnArgs = fn.args || [];
    
    // Function can have optional params, but must accept at least the required ones
    if (params.length > 0) {
      // For predicates/functions, check if first param matches or can be external
      if (fnArgs.length === 0) return false;
      
      const firstParam = fnArgs[0];
      // Match if the parameter type matches AND it can be external (curried)
      if (firstParam.type === params[0] && firstParam.canBeExternal) {
        return true;
      }
      
      // Also match if all expected params are covered
      if (fnArgs.length >= params.length) {
        const allMatch = params.every((expectedParam, idx) => 
          fnArgs[idx] && fnArgs[idx].type === expectedParam
        );
        if (allMatch) return true;
      }
    }
    
    return false;
  }
  
  // Not a function type, do regular type matching
  return typeMatches(fn.outputType, expectedType);
}

// Helper function to check if a type matches the expected type
function typeMatches(actualType: string, expectedType: string): boolean {
  if (!expectedType) return true;

  // Exact match
  if (actualType === expectedType) return true;

  // Handle generic types (e.g., "Array<Person>" matches "Array<T>")
  const expectedBase = expectedType.split("<")[0];
  const actualBase = actualType.split("<")[0];
  if (expectedBase === actualBase) return true;

  // Handle repeated parameters (type can be the element type or array of it)
  if (expectedType.startsWith("Array<")) {
    const innerType = expectedType.slice(6, -1);
    return actualType === innerType || actualType === expectedType;
  }

  return false;
}

// This handler provides the initial list of the completion items
connection.onCompletion(
  (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) {
      return [];
    }

    const text = document.getText();
    const offset = document.offsetAt(textDocumentPosition.position);

    // Determine expected type at cursor position
    const expectedType = getExpectedTypeAtPosition(text, offset);

    connection.console.log(
      `Completion requested. Expected type: ${expectedType || "any"}`
    );

    const completions: CompletionItem[] = [];

    // Add functions that match the expected type
    allFunctions.forEach((fn, index) => {
      // If we're inside a function call, only show functions that match the expected type
      if (expectedType && !functionMatchesType(fn, expectedType)) {
        return;
      }

      const args = fn.args || [];
      const argList = args
        .map((arg: any) => {
          const optional = arg.defaultValue !== undefined ? "?" : "";
          return `${arg.name}${optional}: ${arg.type}`;
        })
        .join(", ");

      completions.push({
        label: fn.name,
        kind: CompletionItemKind.Function,
        data: index,
        detail: `${fn.name}(${argList}) -> ${fn.outputType}`,
        documentation: fn.docs || `Function: ${fn.name}`,
      });
    });

    // Add event literals only if expecting Event type
    if (!expectedType || typeMatches("Event", expectedType)) {
      const events = [
        "_222",
        "_333",
        "_444",
        "_555",
        "_666",
        "_777",
        "_333bf",
        "_333fm",
        "_333oh",
        "_clock",
        "_minx",
        "_pyram",
        "_skewb",
        "_sq1",
        "_444bf",
        "_555bf",
        "_333mbf",
      ];
      events.forEach((event) => {
        completions.push({
          label: event,
          kind: CompletionItemKind.Constant,
          detail: "Event literal",
          documentation: `WCA Event: ${event}`,
        });
      });
    }

    // Add boolean literals only if expecting Boolean type
    if (!expectedType || typeMatches("Boolean", expectedType)) {
      completions.push(
        {
          label: "true",
          kind: CompletionItemKind.Keyword,
          detail: "Boolean literal",
        },
        {
          label: "false",
          kind: CompletionItemKind.Keyword,
          detail: "Boolean literal",
        }
      );
    }

    // Add DNF/DNS only if expecting Time type
    if (!expectedType || typeMatches("Time", expectedType)) {
      completions.push(
        {
          label: "DNF",
          kind: CompletionItemKind.Constant,
          detail: "Did Not Finish",
        },
        {
          label: "DNS",
          kind: CompletionItemKind.Constant,
          detail: "Did Not Start",
        }
      );
    }

    return completions;
  }
);

// This handler resolves additional information for the completion item
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  if (item.data !== undefined && allFunctions[item.data]) {
    const fn = allFunctions[item.data];

    let documentation = fn.docs || "";

    if (fn.args && fn.args.length > 0) {
      documentation += "\n\nParameters:\n";
      fn.args.forEach((arg: any) => {
        const optional = arg.defaultValue !== undefined ? " (optional)" : "";
        const repeated = arg.repeated ? " (repeated)" : "";
        const external = arg.canBeExternal ? " (can be external)" : "";
        documentation += `- ${arg.name}: ${arg.type}${optional}${repeated}${external}\n`;
        if (arg.docs) {
          documentation += `  ${arg.docs}\n`;
        }
      });
    }

    documentation += `\nReturns: ${fn.outputType}`;

    if (fn.genericParams && fn.genericParams.length > 0) {
      documentation += `\nGeneric Parameters: ${fn.genericParams.join(", ")}`;
    }

    item.documentation = documentation;
  }
  return item;
});

// Provide hover information
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const text = document.getText();
  const offset = document.offsetAt(params.position);

  // Find the word at the cursor position
  let start = offset;
  let end = offset;

  while (start > 0 && /[a-zA-Z_]/.test(text[start - 1])) {
    start--;
  }
  while (end < text.length && /[a-zA-Z0-9_]/.test(text[end])) {
    end++;
  }

  const word = text.substring(start, end);

  // Find matching function
  const fn = allFunctions.find((f) => f.name === word);
  if (fn) {
    const args = fn.args || [];
    const argList = args
      .map((arg: any) => {
        const optional = arg.defaultValue !== undefined ? "?" : "";
        return `${arg.name}${optional}: ${arg.type}`;
      })
      .join(", ");

    let hover = `**${fn.name}**(${argList}) → ${fn.outputType}\n\n`;
    if (fn.docs) {
      hover += fn.docs + "\n\n";
    }

    if (args.length > 0) {
      hover += "**Parameters:**\n";
      args.forEach((arg: any) => {
        hover += `- \`${arg.name}\`: ${arg.type}`;
        if (arg.defaultValue !== undefined) hover += " (optional)";
        if (arg.repeated) hover += " (repeated)";
        if (arg.canBeExternal) hover += " (can be external)";
        hover += "\n";
      });
    }

    return {
      contents: {
        kind: "markdown",
        value: hover,
      },
    };
  }

  return null;
});

// Provide signature help
connection.onSignatureHelp(
  (params: TextDocumentPositionParams): SignatureHelp | null => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }

    const text = document.getText();
    const offset = document.offsetAt(params.position);

    // Find the function call we're in
    let depth = 0;
    let functionStart = -1;

    for (let i = offset - 1; i >= 0; i--) {
      if (text[i] === ")") depth++;
      if (text[i] === "(") {
        depth--;
        if (depth < 0) {
          functionStart = i;
          break;
        }
      }
    }

    if (functionStart === -1) {
      return null;
    }

    // Find function name
    let nameEnd = functionStart;
    let nameStart = functionStart - 1;
    while (nameStart >= 0 && /[a-zA-Z0-9_]/.test(text[nameStart])) {
      nameStart--;
    }
    nameStart++;

    const functionName = text.substring(nameStart, nameEnd);
    const matchingFunctions = allFunctions.filter(
      (f) => f.name === functionName
    );

    if (matchingFunctions.length === 0) {
      return null;
    }

    // Calculate active parameter
    let paramIndex = 0;
    depth = 0;
    for (let i = functionStart + 1; i < offset; i++) {
      if (text[i] === "(") depth++;
      if (text[i] === ")") depth--;
      if (text[i] === "," && depth === 0) paramIndex++;
    }

    const signatures: SignatureInformation[] = matchingFunctions.map((fn) => {
      const args = fn.args || [];
      const params: ParameterInformation[] = args.map((arg: any) => {
        const optional = arg.defaultValue !== undefined ? "?" : "";
        return {
          label: `${arg.name}${optional}: ${arg.type}`,
          documentation: arg.docs || "",
        };
      });

      const label = `${fn.name}(${params.map((p) => p.label).join(", ")}) -> ${
        fn.outputType
      }`;

      return {
        label,
        documentation: fn.docs || "",
        parameters: params,
        activeParameter: Math.min(paramIndex, params.length - 1),
      };
    });

    return {
      signatures,
      activeSignature: 0,
      activeParameter: paramIndex,
    };
  }
);

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();
