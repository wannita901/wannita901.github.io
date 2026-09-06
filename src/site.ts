// ponytail: single config object; edit here, everything re-renders.
export const site = {
  // page look: 'plain' | 'ruled' | 'desk'. Preview any with ?look=… in the URL.
  look: 'desk',
  name: 'Wannita Takerngsaksiri',
  shortName: 'Wannita',
  url: 'https://wannita901.github.io',
  description: 'AI for Software Engineering researcher. Research Fellow at Deakin A2I2, Melbourne.',
  role: 'AI researcher & engineer · Melbourne',
  bio: "I build and study AI tools for software engineers. Research Fellow at Deakin's A2I2, working with industry on agentic systems and their evaluation. PhD from Monash on code generation (RL & human-in-the-loop systems), where I also taught software engineering and software testing.",
  // rendered as: previously, data scientist intern at [Atlassian], and data scientist at [SCB] and [CP Group].
  previously: {
    intern: { label: 'Atlassian', icon: 'atlassian', href: 'https://www.atlassian.com' },
    roles: [
      { label: 'SCB', icon: 'scb', href: 'https://www.scb.co.th' },
      { label: 'CP Group', icon: 'cp', href: 'https://www.cpgroupglobal.com' },
    ],
  },
  outside: 'Outside work: ▤ reader · ✦ community service · ⚑ hackathons',
  email: 'wannita.takerngsaksiri@deakin.edu.au',
  // icon = key in src/components/icons.ts
  socials: [
    { label: 'GitHub', href: 'https://github.com/wannita901', icon: 'github' },
    { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=Yzpk-0AAAAAJ', icon: 'scholar' },
    { label: 'Hugging Face', href: 'https://huggingface.co/Wannita', icon: 'huggingface' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/wannita-takerngsaksiri/', icon: 'linkedin' },
    { label: 'ORCID', href: 'https://orcid.org/0000-0001-9909-8850', icon: 'orcid' },
    { label: 'Email', href: 'mailto:wannita.takerngsaksiri@deakin.edu.au', icon: 'email' },
    // { label: 'X', href: 'https://x.com/wannita_tkn', icon: 'x' },
  ],
  scholarly: [
    { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=Yzpk-0AAAAAJ' },
    { label: 'DBLP', href: 'https://dblp.org/pid/240/1575.html' },
    { label: 'ORCID', href: 'https://orcid.org/0000-0001-9909-8850' },
  ],
  supervision: 'Open to supervising Masters by Research and PhD students at A2I2. Topics include, but are not limited to: self-improving agents, LLM-based simulation tools, AI for science, and agentic evals. Email me a one-page idea.',
  nav: [
    { label: 'Blog', href: '/blog/' },
    { label: 'Projects', href: '/projects/' },
    { label: 'Publications', href: '/publications/' },
  ],
};
