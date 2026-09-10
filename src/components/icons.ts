// Monochrome brand marks (fill: currentColor). Brand paths from simple-icons; LinkedIn and email hand-written.
import { siGithub, siGooglescholar, siHuggingface, siOrcid, siX, siAtlassian } from 'simple-icons';

const p = (d: string) => `<path d="${d}"/>`;

// stroke icons (outside-work items); rendered with class="stroke"
const s = (d: string) => `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;

export const icons: Record<string, string> = {
  book: s('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>'),
  star: s('<path d="M12 3l2.4 5.6 6.1.5-4.6 4 1.4 6-5.3-3.2-5.3 3.2 1.4-6-4.6-4 6.1-.5z"/>'),
  flag: s('<path d="M5 21V4"/><path d="M5 4h11l-1.5 3.5L16 11H5"/>'),
  github: p(siGithub.path),
  scholar: p(siGooglescholar.path),
  huggingface: p(siHuggingface.path),
  orcid: p(siOrcid.path),
  x: p(siX.path),
  atlassian: p(siAtlassian.path),
  // hand-drawn mono approximations of employer marks (fill-rule evenodd)
  cp: '<path fill-rule="evenodd" d="M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4zm.5 2h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4z"/><path d="M11.3 15.2C8.6 14.2 5.4 11 6.6 6.4c2.4 1.2 4.6 4.6 4.7 8.8zM12.7 15.2c2.7-1 5.9-4.2 4.7-8.8-2.4 1.2-4.6 4.6-4.7 8.8zM12 5.6l2 3.9-2 3.7-2-3.7zM11.2 15.4h1.6v3.8h-1.6z"/>',
  scb: '<path fill-rule="evenodd" d="M12 1a11 11 0 1 0 0 22 11 11 0 1 0 0-22zm0 4c-2.5 2.5-6.5 5-6 8.5.4 2.8 3 3.9 5.1 2.9V19h1.8v-2.6c2.1 1 4.7-.1 5.1-2.9.5-3.5-3.5-6-6-8.5zm0 3c-1.5 1.6-3.6 3-3.3 5.2.3 1.8 1.9 2.3 2.4 1.5h1.8c.5.8 2.1.3 2.4-1.5.3-2.2-1.8-3.6-3.3-5.2z"/>',
  linkedin: p('M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'),
  email: p('M2 4h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2.4V18h18V6.4l-9 6.3-9-6.3zM4.2 6l7.8 5.5L19.8 6H4.2z'),
};
