// Minimal, dependency-free syntax highlighter. Good enough for short snippets,
// not a real tokenizer — single-pass regex classifying comments/strings/numbers/keywords.
const KEYWORDS: Record<string, string[]> = {
  typescript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "interface", "type", "extends", "implements", "import", "export", "from", "async", "await", "new", "this", "void", "enum", "public", "private", "readonly", "as"],
  javascript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "async", "await", "new", "this", "void"],
  python: ["def", "return", "if", "elif", "else", "for", "while", "class", "import", "from", "as", "with", "try", "except", "finally", "lambda", "yield", "in", "is", "not", "and", "or", "None", "True", "False", "self"],
  rust: ["fn", "let", "mut", "return", "if", "else", "for", "while", "loop", "match", "struct", "enum", "impl", "trait", "pub", "use", "mod", "self", "Self", "const", "static", "macro_rules"],
  go: ["func", "return", "if", "else", "for", "range", "var", "const", "type", "struct", "interface", "package", "import", "go", "defer", "select", "case", "switch", "chan"],
  ruby: ["def", "end", "return", "if", "elsif", "else", "unless", "class", "module", "do", "while", "until", "require", "attr_accessor", "self", "yield", "scope", "true", "false"],
  sql: ["SELECT", "FROM", "WHERE", "ORDER", "BY", "DESC", "ASC", "LIMIT", "CREATE", "INDEX", "CONCURRENTLY", "ON", "INCLUDE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "JOIN", "GROUP"],
  css: [],
  zig: ["fn", "return", "if", "else", "for", "while", "struct", "enum", "const", "var", "pub", "comptime", "try", "catch", "test"],
  swift: ["func", "return", "if", "else", "for", "while", "struct", "enum", "class", "var", "let", "case", "switch", "self", "some", "protocol"],
};

const TOKEN_PATTERN = /(#|\/\/)[^\n]*|("|'|`)(?:(?!\2)[^\\]|\\.)*\2|\b\d+(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_]*/g;

export function highlight(code: string, lang?: string | null): string {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const words = new Set(KEYWORDS[lang?.toLowerCase() ?? ""] ?? []);

  return escaped.replace(TOKEN_PATTERN, (match) => {
    if (match.startsWith("#") || match.startsWith("//")) {
      return `<span class="tok-comment">${match}</span>`;
    }
    if (match[0] === '"' || match[0] === "'" || match[0] === "`") {
      return `<span class="tok-string">${match}</span>`;
    }
    if (/^\d/.test(match)) {
      return `<span class="tok-number">${match}</span>`;
    }
    if (words.has(match)) {
      return `<span class="tok-keyword">${match}</span>`;
    }
    return match;
  });
}
