import { createElement, type ReactNode } from 'react';

const CJK_CHARACTER = /[\u3400-\u9fff\uf900-\ufaff]/u;

function getSearchTerms(keyword: string): string[] {
  const normalized = keyword.trim();
  const terms = new Set<string>(normalized ? [normalized] : []);
  const characters = Array.from(normalized);

  characters.forEach((character, index) => {
    if (!CJK_CHARACTER.test(character)) return;

    terms.add(character);
    const nextCharacter = characters[index + 1];
    if (nextCharacter && CJK_CHARACTER.test(nextCharacter)) {
      terms.add(`${character}${nextCharacter}`);
    }
  });

  return [...terms];
}

function findMatches(title: string, keyword: string): Array<[number, number]> {
  const matches: Array<[number, number]> = [];

  for (const term of getSearchTerms(keyword)) {
    let start = 0;
    while (term && start < title.length) {
      const index = title.toLocaleLowerCase().indexOf(term.toLocaleLowerCase(), start);
      if (index < 0) break;
      matches.push([index, index + term.length]);
      start = index + Math.max(term.length, 1);
    }
  }

  return matches.sort(([left], [right]) => left - right);
}

export function highlightTitle(title: string, keyword: string): ReactNode {
  if (!keyword.trim()) return title;

  const ranges = findMatches(title, keyword).reduce<Array<[number, number]>>((merged, [start, end]) => {
    const previous = merged.at(-1);
    if (previous && start <= previous[1]) {
      previous[1] = Math.max(previous[1], end);
    } else {
      merged.push([start, end]);
    }
    return merged;
  }, []);

  if (!ranges.length) return title;

  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], index) => {
    if (start > cursor) parts.push(title.slice(cursor, start));
    parts.push(
      createElement(
        'strong',
        { className: 'bg-yellow-300 text-black', key: `${start}-${end}-${index}` },
        title.slice(start, end),
      ),
    );
    cursor = end;
  });
  if (cursor < title.length) parts.push(title.slice(cursor));
  return parts;
}
