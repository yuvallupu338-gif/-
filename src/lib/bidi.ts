const HEBREW = /[\u0590-\u05FF]/;
const LTR = /[A-Za-z0-9]/;

type Token = { kind: "rtl" | "ltr" | "neutral"; text: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  for (const char of input) {
    const kind = HEBREW.test(char) ? "rtl" : LTR.test(char) ? "ltr" : "neutral";
    const previous = tokens[tokens.length - 1];
    if (previous && previous.kind === kind) previous.text += char;
    else tokens.push({ kind, text: char });
  }
  return tokens;
}

/** Visual left-to-right order for a predominantly Hebrew line drawn by a LTR canvas. */
export function toVisualRtl(input: string) {
  const tokens = tokenize(input);
  const visual = tokens.reverse().map((token) => {
    if (token.kind === "rtl") return [...token.text].reverse().join("");
    return token.text;
  });
  return visual.join("");
}

export function isMostlyRtl(input: string) {
  const hebrew = (input.match(/[\u0590-\u05FF]/g) ?? []).length;
  const latin = (input.match(/[A-Za-z]/g) ?? []).length;
  return hebrew >= latin;
}
