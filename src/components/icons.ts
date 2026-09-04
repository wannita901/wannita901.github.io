// Monochrome brand marks (fill: currentColor). Brand paths from simple-icons; LinkedIn and email hand-written.
import { siGithub, siGooglescholar, siHuggingface, siOrcid, siX } from 'simple-icons';

const p = (d: string) => `<path d="${d}"/>`;

export const icons: Record<string, string> = {
  github: p(siGithub.path),
  scholar: p(siGooglescholar.path),
  huggingface: p(siHuggingface.path),
  orcid: p(siOrcid.path),
  x: p(siX.path),
  linkedin: p('M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'),
  email: p('M2 4h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2.4V18h18V6.4l-9 6.3-9-6.3zM4.2 6l7.8 5.5L19.8 6H4.2z'),
};
