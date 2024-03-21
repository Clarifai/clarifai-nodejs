const { Converter } = require("typedoc");
const {
  iterateProjectComments,
} = require("../node_modules/typedoc-plugin-include-example/src/iterate-project-comments");
const {
  findExample,
} = require("../node_modules/typedoc-plugin-include-example/src/find-example");

function includeExample(comment, example) {
  comment.summary.push({
    kind: "code",
    text: `\n\n### Example\n\`\`\`ts\n${example}\`\`\``,
  });

  comment.blockTags = comment.blockTags.filter(
    (tag) => tag.tag !== "@includeExample",
  );
}

function processComments(context) {
  for (const comment of iterateProjectComments(context)) {
    const example = findExample(comment);

    if (example !== null) {
      const exampleWithPackageImport = example.replace(
        /import {(.+)} from "\.\.\/\.\.\/src\/index"/g,
        'import {$1} from "clarifai-nodejs"',
      );
      includeExample(comment, exampleWithPackageImport);
    }
  }
}

exports.load = function (application) {
  application.converter.on(Converter.EVENT_RESOLVE_BEGIN, processComments);
};
