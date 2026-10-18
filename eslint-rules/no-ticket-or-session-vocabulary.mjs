const BANNED_PATTERNS = [
  { pattern: /\bEUDPA-\d+/i, label: 'a Jira ticket key' },
  { pattern: /\b(?:c|d|q|inc|req)-\d{3}\b/i, label: 'a backlog or ruling id' },
  { pattern: /\bdesign release\b/i, label: 'a release name' },
  { pattern: /\b(?:parity-)?DR ?\d+(?:\.\d+)?\b/i, label: 'a release name' },
  { pattern: /\bruled\b/i, label: 'a ruling reference' },
  { pattern: /\breal service\b/i, label: 'session vocabulary' },
];

const TEST_FUNCTION_NAMES = new Set(['test', 'it', 'describe']);

const findBannedLabel = (text) => BANNED_PATTERNS.find(({ pattern }) => pattern.test(text))?.label;

const rootIdentifierName = (callee) => {
  let node = callee;
  while (node.type === 'MemberExpression') node = node.object;
  return node.type === 'Identifier' ? node.name : undefined;
};

const stringNodesOf = (node) => {
  if (!node) return [];
  if (node.type === 'Literal' && typeof node.value === 'string') return [{ node, text: node.value }];
  if (node.type === 'TemplateLiteral') return [{ node, text: node.quasis.map((quasi) => quasi.value.cooked ?? '').join(' ') }];
  if (node.type === 'ArrayExpression') return node.elements.flatMap(stringNodesOf);
  return [];
};

const tagNodesOf = (details) => {
  if (details?.type !== 'ObjectExpression') return [];
  const tagProperty = details.properties.find(
    (property) => property.type === 'Property' && property.key.type === 'Identifier' && property.key.name === 'tag',
  );
  return tagProperty ? stringNodesOf(tagProperty.value) : [];
};

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow ticket keys, backlog and ruling ids, release names and session vocabulary in comments, test titles and test tags',
    },
    schema: [],
    messages: {
      inComment: 'Comment contains {{label}}. Say what the code does now; the history belongs in git.',
      inTestTitle: 'Test title or tag contains {{label}}. State what the assertions prove.',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const label = findBannedLabel(comment.value);
          if (label) context.report({ loc: comment.loc, messageId: 'inComment', data: { label } });
        }
      },
      CallExpression(call) {
        if (!TEST_FUNCTION_NAMES.has(rootIdentifierName(call.callee))) return;
        const [title, details] = call.arguments;
        for (const { node, text } of [...stringNodesOf(title), ...tagNodesOf(details)]) {
          const label = findBannedLabel(text);
          if (label) context.report({ node, messageId: 'inTestTitle', data: { label } });
        }
      },
    };
  },
};
