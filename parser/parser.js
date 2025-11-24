const fs = require("fs/promises");
const util = require("util");
const path = require("path");
const peggy = require("peggy");

const driver = require("./driver");

async function parse(text, req, res, ctx, allowParams) {
  var out = {
    outputs: [],
    mutations: [],
  };
  var parser = null;
  const grammarPath = path.join(__dirname, "grammar.pegjs");
  const data = await fs.readFile(grammarPath);
  try {
    parser = peggy.generate(data.toString());
  } catch (err) {
    console.log(err);
    var line = data.toString().split("\n")[err.location.start.line - 1];
    out.outputs.push({
      type: "Error",
      data: {
        type: "GrammarParseError",
        data: {
          line: line,
          location: err.location,
        },
      },
    });
    return out;
  }
  var tree = null;
  try {
    tree = parser.parse(text, { startRule: "Input" });
  } catch (err) {
    console.log(err);
    console.log(util.inspect(err.expected, { depth: null }));
    var line = text.split("\n")[err.location.start.line - 1];
    out.outputs.push({
      type: "Error",
      data: {
        type: "InputParseError",
        data: {
          line: line,
          location: err.location,
        },
      },
    });
    return out;
  }
  try {
    for (const expr of tree) {
      var parsedExpr = driver.parseNode(expr, ctx, allowParams);
      if (parsedExpr.errors) {
        out.mutations = [];
        out.outputs = parsedExpr.errors.map((err) => {
          return { type: "Error", data: err };
        });
        return out;
      }
      var outputType = parsedExpr.type;
      if (outputType.params.length) {
        out.mutations = [];
        out.outputs = [
          {
            type: "Error",
            data: { errorType: "WRONG_OUTPUT_TYPE", type: outputType },
          },
        ];
        return out;
      }
      var scriptResult = await parsedExpr.value({}, ctx);
      out.outputs.push({ type: outputType.type, data: scriptResult });
      parsedExpr.mutations.forEach((mutation) => {
        if (!out.mutations.includes(mutation)) {
          out.mutations.push(mutation);
        }
      });
    }
    out.outputs.push({ type: "CompetitionWCIF", data: ctx.competition });
  } catch (e) {
    out.outputs.splice(0, 0, { type: "Exception", data: e.stack });
    out.mutations = [];
  }
  return out;
}

module.exports = {
  parse: parse,
};
