function camelCaseToSpaced(input: string): string {
  return input.replace(/([A-Z])/g, ' $1').trim();
}

export function camelCaseToSentenceCase(input: string): string {
  const spaced = camelCaseToSpaced(input);
  return spaced.length === 0 ? spaced : spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function camelCaseToTitleCase(input: string): string {
  return camelCaseToSpaced(input).replace(/^./, (c) => c.toUpperCase());
}
