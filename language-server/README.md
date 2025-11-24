# CompScript Language Server

A Language Server Protocol (LSP) implementation for CompScript, a domain-specific language for managing WCA (World Cube Association) competitions.

## Features

### Syntax Validation

- Real-time syntax error detection using the peggy parser
- Detailed error messages with expected tokens
- Error highlighting in the editor

### IntelliSense & Autocomplete

- Function name completion with signatures
- Event literal completion (\_333, \_444bf, etc.)
- Boolean and special literals (true, false, DNF, DNS)
- Type information in completion details

### Hover Information

- Function documentation on hover
- Parameter information with types
- Return type information
- Generic parameter details

### Signature Help

- Parameter hints while typing function calls
- Active parameter highlighting
- Multiple overload support
- Documentation for each parameter

## Installation

### Prerequisites

- Node.js (>= 16.0.0)
- VS Code (>= 1.75.0)

### Building from Source

1. Install dependencies for the language server:

```bash
cd language-server
npm install
npm run compile
```

2. Install dependencies for the VS Code extension:

```bash
cd vscode-extension
npm install
npm run compile
```

3. Install the extension:
   - Open VS Code
   - Press F5 to launch the Extension Development Host
   - Or package the extension with `vsce package` and install the .vsix file

## Development

### Structure

```
.
├── language-server/           # LSP server implementation
│   ├── src/
│   │   └── server.ts         # Main language server
│   ├── package.json
│   └── tsconfig.json
│
└── vscode-extension/          # VS Code client extension
    ├── src/
    │   └── extension.ts      # Extension entry point
    ├── syntaxes/
    │   └── compscript.tmLanguage.json  # Syntax highlighting
    ├── language-configuration.json     # Language config
    ├── package.json
    └── tsconfig.json
```

### Running in Development Mode

1. Open the project in VS Code
2. Open the Run and Debug view (Ctrl+Shift+D)
3. Select "Launch Client" from the dropdown
4. Press F5 to start debugging

### Debugging

The language server can be debugged by:

1. Setting breakpoints in `language-server/src/server.ts`
2. Attaching the debugger to the language server process (port 6009)

## Configuration

The extension can be configured in VS Code settings:

```json
{
  "compscript.maxNumberOfProblems": 100,
  "compscript.trace.server": "off" // or "messages" or "verbose"
}
```

## Language Features

### Supported File Extensions

- `.cs`
- `.compscript`

### Syntax Highlighting

The extension provides syntax highlighting for:

- Comments (# line comments)
- Strings ("...")
- Numbers (integers and decimals)
- Booleans (true, false)
- Event literals (\_333, \_333bf, etc.)
- Attempt results (12.34s, DNF, DNS)
- Date/DateTime literals (2023-01-01, 2023-01-01T10:30)
- Person literals (2005REYN01, p12345)
- Function names
- Operators (==, !=, <, >, &&, ||, +, -, \*, /)

### Code Snippets

The extension will automatically close:

- Parentheses `( )`
- Brackets `[ ]`
- Braces `{ }`
- Quotes `" "`

## Extending the Language Server

### Adding New Functions

Functions are loaded from the main CompScript project. To add new functions:

1. Add the function definition to the appropriate file in `/functions/`
2. Ensure it's exported in `/functions/functions.js`
3. Reload the language server

The language server will automatically provide:

- Autocomplete for the new function
- Hover documentation
- Signature help

### Function Definition Format

Functions should follow this structure:

```javascript
const MyFunction = {
  name: "MyFunction",
  docs: "Description of what the function does",
  args: [
    {
      name: "paramName",
      type: "Type",
      canBeExternal: true, // optional
      defaultValue: null, // optional
      repeated: false, // optional
      nullable: false, // optional
    },
  ],
  outputType: "ReturnType",
  genericParams: ["T"], // optional
  implementation: (ctx, param) => {
    // implementation
  },
};
```

## Troubleshooting

### Language Server Not Starting

1. Check that the language server is compiled:

   ```bash
   cd language-server
   npm run compile
   ```

2. Check the Output panel in VS Code (View → Output) and select "CompScript Language Server"

3. Enable verbose logging:
   ```json
   {
     "compscript.trace.server": "verbose"
   }
   ```

### Autocomplete Not Working

1. Ensure you're editing a file with `.cs` or `.compscript` extension
2. Check that the parser and functions loaded successfully in the Output panel
3. Restart the language server (Reload Window)

### Syntax Errors Not Showing

1. Verify the parser is loaded (check Output panel)
2. Ensure the grammar.pegjs file is compiled to parser.js
3. Check file permissions

## Contributing

Contributions are welcome! Please ensure:

1. Code follows the existing style
2. TypeScript compiles without errors
3. Extension activates without errors in the Extension Development Host

## License

ISC License - See LICENSE file for details

## Credits

- Built on the Language Server Protocol
- Uses peggy for parsing
- Part of the CompScript project for WCA competition management
