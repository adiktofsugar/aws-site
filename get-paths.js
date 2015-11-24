var fs = require('fs');
var path = require('path');
var async = require('async');
var esprima = require('esprima');

function getRequireStatements(fileContents) {
    var tokens = esprima.tokenize(fileContents);
    var statements = [];
    tokens.forEach(function (token, i) {
        if (
            token.value == 'require' &&
            token.type == 'Identifier' &&
            tokens[i + 1] && tokens[i + 1].value == '(' &&
            tokens[i + 2]
        ) {
            var requireArgumentRaw = tokens[i + 2].value;
            var requireArgument = requireArgumentRaw
                .replace(/^('|")/, '')
                .replace(/('|")$/, '');
            if (requireArgumentRaw !== requireArgument) {
                statements.push(requireArgument);
            }
        }
    });
    return statements;
}

var projectRoot = __dirname;
var files = new Set();
function addPaths(filePath, callback) {
    filePath = path.resolve(projectRoot, filePath)
    var cwd = path.dirname(filePath);
    files.add(filePath);
    var fileContents = fs.readFileSync(filePath, 'utf-8');
    var requireStatements = getRequireStatements(fileContents);
    console.log("filePath", filePath);
    console.log("requireStatements", requireStatements);
    async.each(requireStatements, function (requireStatement, callback) {
        if (requireStatement.match(/^\./)) {
            requireStatement = path.resolve(cwd, requireStatement);
        }
        var modulePath = require.resolve(requireStatement);
        var isPath = modulePath.match(path.sep);
        if (isPath) {
            addPaths(modulePath, callback);
        } else {
            callback();
        }
    }, callback);
}
addPaths('index.js', function (error) {
    if (error) return console.error(error) && process.exit(1);
    console.log("files", JSON.stringify(Array.from(files), null, 4));
});
