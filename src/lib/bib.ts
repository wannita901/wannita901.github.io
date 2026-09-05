import { readFileSync } from 'node:fs';
import bibtexParse from 'bibtex-parse-js';

export type Pub = {
  key: string;
  title: string;
  authors: string[];
  venue: string;
  short: string;
  year: number;
  selected: boolean;
  links: { label: string; href: string }[];
};

const LINK_FIELDS = ['pdf', 'arxiv', 'doi', 'code', 'models', 'blog', 'slides'] as const;

const clean = (s = '') => s.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();

function author(raw: string): string {
  const [last, first] = raw.split(',').map((x) => x.trim());
  return first ? `${first} ${last}` : last;
}

export function loadPublications(path = 'src/data/publications.bib'): Pub[] {
  const entries = bibtexParse.toJSON(readFileSync(path, 'utf8'));
  return entries
    .filter((e: any) => e.entryTags)
    .map((e: any) => {
      const t: Record<string, string> = {};
      for (const [k, v] of Object.entries(e.entryTags)) t[k.toLowerCase()] = v as string;
      const links = LINK_FIELDS.flatMap((f) => {
        if (!t[f]) return [];
        let href = clean(t[f]);
        if (f === 'arxiv' && !href.startsWith('http')) href = `https://arxiv.org/abs/${href}`;
        if (f === 'doi' && !href.startsWith('http')) href = `https://doi.org/${href}`;
        return [{ label: f, href }];
      });
      return {
        key: e.citationKey,
        title: clean(t.title),
        authors: clean(t.author).split(/\s+and\s+/).map(author),
        venue: clean(t.venue ?? t.booktitle ?? t.journal ?? ''),
        short: clean(t.short ?? (t.venue ?? '').split(/[\s,]/)[0]),
        year: Number(clean(t.year)),
        selected: /true|yes/i.test(t.selected ?? ''),
        links,
      };
    })
    .sort((a, b) => b.year - a.year);
}

export function byYear(pubs: Pub[]): [number, Pub[]][] {
  const m = new Map<number, Pub[]>();
  for (const p of pubs) m.set(p.year, [...(m.get(p.year) ?? []), p]);
  return [...m.entries()].sort((a, b) => b[0] - a[0]);
}
