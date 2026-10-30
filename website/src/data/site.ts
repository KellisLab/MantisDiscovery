// All visible content lives here.
//
// Sources: the four papers the site shows, the strongest of the 15 the lab has on Zenodo: two in
// mathematics, one in physics and one in machine learning (owner's call, 25 Oct), picked so the site
// stands on a few results that hold up rather than a long list. Metadata via the Zenodo API, abstracts
// transcribed from the PDFs on 21 Oct 2026. "25+ researchers, including olympiad medalists" is the
// owner's own description; the group also includes PhD students, so the copy never calls it a student
// group (22 Oct).
//
// Notes:
// - The team (team, below) is the owner's list plus everyone who answered the lab's sign-up form; bios
//   come only from each person's research answer.
// - Discovery uses the Mantis mark, faces and palette (mantis.csail.mit.edu). The owner confirmed the
//   MIT CSAIL affiliation; "part of Mantis" in the footer is the remaining wording to confirm.
//
// Markup in strings: ^{…} is a superscript, _{…} a subscript (rendered by <Tex>).

import timing from './figure-timing.json';

/** A file from public/, under the path the site is served from (/MantisDiscovery on GitHub Pages). */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;

export type Field = 'mathematics' | 'physics' | 'machine-learning';

const fields: { id: Field; label: string }[] = [
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'physics', label: 'Physics' },
  { id: 'machine-learning', label: 'Machine learning' },
];

/**
 * One animated figure per paper, plus 'void': the 404's unit square with no barrier. Each is a short 3D
 * film made with Kinetograph (graphics/, rendered to public/media/figures). It plays in beats, and the
 * site sets one caption per beat under it, timed by figure-timing.json, which the render writes.
 */
export type FigureId = 'opaque' | 'clique' | 'gyro' | 'elliptic' | 'void';
export type Figure = {
  id: FigureId;
  /** What the whole film shows, for screen readers. */
  alt: string;
  /** One plain sentence per beat, in order. ^{…} and _{…} markup as elsewhere. */
  beats: string[];
};
export type FigureMedia = Figure & { src: string; poster: string; duration: number; starts: number[]; posterAt: number };
export const figureMedia = (f: Figure): FigureMedia => {
  const t = timing[f.id];
  if (t.beats.length !== f.beats.length) throw new Error(`figure ${f.id}: ${f.beats.length} captions for ${t.beats.length} beats`);
  return { ...f, src: asset(`/media/figures/${f.id}.mp4`), poster: asset(`/media/figures/${f.id}.webp`), duration: t.duration, starts: t.beats, posterAt: t.poster };
};

export type Paper = {
  slug: string;
  tag: string; // two or three words, for tight spots such as the footer
  record: number;
  doi: string;
  title: string;
  /** Page-title form (51 characters or fewer) for papers whose full title is longer. */
  short?: string;
  field: Field;
  area: string;
  published: string; // ISO date, Zenodo publication date
  pages?: number;
  files: { label: string; name: string; bytes: number; pages: number }[];
  summary: string; // one sentence: index line and meta description
  shows: string[]; // what the paper establishes (theorem voice, inked)
  limits: string[]; // what it does not claim (draft voice)
  abstract: string[] | null;
  figure: Figure;
  /** The paper's own space in Mantis: how many records it holds, what the work used, and a real still. */
  mantis: { records: number; uses: Tech[]; still: Still };
  /** Set on the paper whose result the Method page follows from first question to publication. */
  story?: { href: string; label: string };
};

export const site = {
  name: 'Mantis Discovery',
  role: 'Research initiative at MIT CSAIL',
  // Where the site is published (canonical URLs, Open Graph, sitemap): the deploy workflow passes the
  // GitHub Pages address, or a custom domain once one is set up.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kellislab.github.io/MantisDiscovery',
  description:
    'Mantis Discovery is a research group at MIT CSAIL. We use AI and the Mantis platform to work on open problems in mathematics, machine learning, physics, chemistry and biology.',
  email: 'pranavak@mit.edu',
  license: 'CC BY 4.0',
};

export const mantis = {
  name: 'Mantis',
  url: 'https://mantis.csail.mit.edu/',
  relation: 'MIT CSAIL', // affiliation confirmed by the owner (21 Oct 2026)
};

export const nav = [
  { href: '/research/', label: 'Research' },
  { href: '/method/', label: 'Method' },
  { href: '/lab/', label: 'Lab' },
];

export const home = {
  eyebrow: 'Research initiative',
  title: 'Mantis Discovery',
  lede: 'We work in mathematics, machine learning, physics, chemistry and biology. We do our research in Mantis, a knowledge platform built at MIT CSAIL.',
  actions: [
    { href: '/research/', label: 'Read the papers' },
    { href: '/method/', label: 'How we work' },
  ],
  statementTitle: 'Mantis',
  statement:
    'Mantis puts the papers, code and data behind a project into one shared space, where AI agents work with our researchers. The agents search the literature and run computations. The researchers check what the agents produce and choose which ideas to pursue.',
  archiveTitle: 'Research',
  archiveLede: 'We have published four papers so far, and all of them are free to read on Zenodo.',
  labTitle: 'The lab',
  labText: 'Our researchers include olympiad medalists and PhD students.',
  medalists: 'Researchers, including medalists from',
  labAction: { href: '/lab/', label: 'Meet the lab' },
};

export const film = {
  title: 'Walkthrough',
  // Structured data only: the page shows the title alone.
  name: 'A walkthrough of Mantis Discovery',
  description: 'A 75-second walkthrough of two Mantis Discovery papers in the Mantis workspace.',
  src: asset('/media/mantis-discovery-demo.mp4'),
  poster: asset('/media/mantis-discovery-demo-poster.jpg'),
  posterPhone: asset('/media/mantis-discovery-demo-poster-phone.jpg'),
  captions: asset('/media/mantis-discovery-demo.vtt'),
  duration: '1:15',
  iso: 'PT1M15S',
  date: '2026-10-06',
};

// The Mantis demo in the home page's Mantis section, from mantis.csail.mit.edu (agent-inspector).
export const mantisDemo = {
  src: asset('/media/mantis-agent-inspector.mp4'),
  poster: asset('/media/mantis-agent-inspector.jpg'),
  label: 'A Mantis workspace: an agent at work on a map of course topics, with its narrator, tree and inspector panels.',
};

// How the lab works: the parts of Mantis every project relies on. Each still is a real capture of the
// lab's own spaces in Mantis (the recordings behind the film, Oct 2026), cropped below the app's menu bar.
export type Tech = 'map' | 'trace' | 'audit' | 'certificate';
export type Still = { src: string; w: number; h: number; alt: string; caption: string };
const still = (name: string, alt: string, caption: string): Still => ({ src: asset(`/media/mantis/${name}.webp`), w: 1600, h: 852, alt, caption });

export const approach: { title: string; lede: string; techs: { id: Tech; name: string; text: string; benefit: string; still: Still }[] } = {
  title: 'Our approach',
  lede: 'Each project has its own space in Mantis. Everything we write or compute for a project is saved there as a record, which we can search and cite later.',
  techs: [
    {
      id: 'map',
      name: 'Geometric reasoning',
      text: 'Mantis represents each record as a point in a space with thousands of dimensions and draws the points as a map, so records that say similar things sit close together. We search the map and outline regions of it to compare the records inside.',
      benefit: 'We can see a project’s whole history at once. Related attempts end up near each other, so it is easy to notice when an idea has been tried before.',
      still: still('map-opaque', 'The opaque sets space in Mantis: hundreds of points grouped into labeled clusters, among them Certificate verification checks and Failed SMT dust claim withdrawals.', 'The opaque sets space holds 1,433 records, grouped into named clusters.'),
    },
    {
      id: 'trace',
      name: 'Traceability',
      text: 'Failed attempts stay in the project along with the fixes that followed them. Each record points to the file and lines it came from and stores a hash of that source, and it carries a status such as withdrawn or independently verified.',
      benefit: 'Anyone can follow how we reached a result, including the approaches that did not work.',
      still: still('trace-hadwiger-draft', 'A record in Mantis: the theorem from an earlier draft of the Hadwiger paper, with its source file, lines 66 to 71, and its status as a historical manuscript assertion.', 'This record holds a theorem from an early draft of the Hadwiger paper, kept as history, and points to lines 66 to 71 of its source.'),
    },
    {
      id: 'audit',
      name: 'Audits',
      text: 'Before a claim goes into a paper, we check it against the records behind it. For our Hadwiger paper, an audit found that an early draft used an inequality in the wrong direction. Later rewrites brought the claimed gap down from eight to two, and the flawed draft is still in the project.',
      benefit: 'Mistakes can be caught before a paper is published, and each correction is filed next to the mistake it fixed.',
      still: still('audit-hadwiger', 'A record from the research audit in Mantis: a table of original claims, the decision on each and the reason for it.', 'This record comes from the audit of the same paper. It lists each original claim with the decision made about it and the reason.'),
    },
    {
      id: 'certificate',
      name: 'Certificates',
      text: 'Some proofs come down to a long but finite list of cases. For those, a program checks every case and saves the result as a certificate, and we test the checker on a deliberately broken input to make sure it fails.',
      benefit: 'Readers can run the check themselves.',
      still: still('certificate-hadwiger', 'A certificate record for the Hadwiger paper in Mantis: branches 20 and 44 touch through an edge, the check passed, and the record is marked independently verified.', 'The certificate atlas for the Hadwiger paper checks 1,540 pairs and keeps a record for each one.'),
    },
  ],
};
export const techName = (t: Tech) => approach.techs.find((x) => x.id === t)!.name;
export const approachLink = { href: '/method/', label: 'More on how we work' };

// The Method page, written as a lab's methods page: plain sections, and one worked example with figures.
// The example is the Higman-Sims bound in the clique minors paper; every record it cites is in that paper's
// Mantis archive (map "Complete paper and research archive", 17,680 records) and appears in the walkthrough
// film (rec/s_chain2 in the film's project, Oct 2026). The certificate facts come from the certificate files
// (hs_certificate_extracted.json, controlled_failure_diagnostic.json).
// Markup in paragraphs: [text](href) is a link, ^{…} and _{…} as elsewhere.
export type MethodFigure =
  | { kind: 'records'; id: string; panels: { still: Still; label: string }[]; caption: string }
  | { kind: 'film'; id: string; slug: string; caption: string };
export type MethodSection = { id: string; title: string; body: (string | MethodFigure)[] };

const record = (name: string, alt: string): Still => ({ src: asset(`/media/mantis/${name}.webp`), w: 1600, h: 852, alt, caption: '' });

export const method: { title: string; lede: string; sections: MethodSection[] } = {
  title: 'How we work',
  lede: 'Our researchers work with AI agents in Mantis, a knowledge platform built at MIT CSAIL. Before we publish a result, we check it against the record of how it was reached.',
  sections: [
    {
      id: 'projects',
      title: 'Running a project',
      body: [
        'Each project is a problem that one of our researchers has chosen to work on. AI agents propose far more questions than we take up, and we start on one only when someone thinks it is worth several weeks of work. Before the work begins, we write down what would count as an answer and which assumptions and methods are allowed.',
        'The work happens in the project’s own space in [Mantis](https://mantis.csail.mit.edu/). Agents there search the literature and the project’s earlier attempts. They also write and run code and draft arguments, which the researchers read and revise. Everything is saved as a record that points to the file and lines it came from, so any claim can be traced back to its source.',
      ],
    },
    {
      id: 'checking',
      title: 'Checking results',
      body: [
        'Before a claim goes into a paper, someone who did not write the argument reads it in full, and an audit compares the claim with the records behind it. When the audit finds a mistake, the draft is corrected and the record of the mistake stays in the space.',
        'When a proof comes down to a finite set of cases, a program checks every case and saves its output as a certificate. Each certificate has a negative control, an altered input that the checker has to reject. Our [opaque sets paper](/research/opaque-sets-reach-bounds/), for example, checks its inequalities in exact arithmetic for all 105 six-leaf topologies and all 45 five/four-leaf pairs.',
        'Every abstract says what the result does not cover. The [gyrokinetics paper](/research/zonal-gyrokinetic-stationary-response/) reports that ordinary orbit averaging changes the stationary field by 23.2%, and states that the figure is stable under its grid refinements but is not a certified continuum value.',
      ],
    },
    {
      id: 'example',
      title: 'An example',
      body: [
        'Our [clique minors paper](/research/clique-minors-independence-two/) proves bounds for H, the complement of the Higman-Sims graph. The project notes list six open questions about H. The first asks whether had(G) ≥ χ(G) for every inflation G of H, and the paper grew out of it (Figure 1a).',
        'An early draft claimed had(H[S]) ≥ χ(H[S]) − 8 for every induced subgraph H[S] (Figure 1b). The audit of that draft found that the proof used χ(G) ≥ ⌈n/2⌉, which holds for graphs with α(G) ≤ 2, as if it were an upper bound on χ(G) (Figure 1c).',
        'The argument was rebuilt. The first rewrite gave an explicit K_{56} model in H and proved had(H[S]) ≥ χ(H[S]) − 6. A later revision replaced its separation argument with a construction that works for every graph with independence number at most two, which improves the bound to χ(H[S]) − 2. That is the version in the published paper (Figure 1d).',
        {
          kind: 'records',
          id: 'figure-1',
          panels: [
            { label: 'a', still: record('method-question', 'A record in the paper’s Mantis space: six open questions from the project notes, lines 15 to 20.') },
            { label: 'b', still: record('method-draft', 'A record in the paper’s Mantis space: the early draft’s theorem, lines 66 to 71, marked as a historical manuscript assertion.') },
            { label: 'c', still: record('method-audit', 'A record in the paper’s Mantis space: the audit’s finding, lines 68 and 69 of the research decisions.') },
            { label: 'd', still: record('method-revision', 'A record in the paper’s Mantis space: the revision that replaces the χ − 6 bound with χ − 2.') },
          ],
          caption: 'Records from the paper’s space in Mantis. (a) The open questions in the project notes, UNRESOLVED_QUESTIONS.md, lines 15-20. (b) The early draft’s theorem, paperG_hadwiger_minus8.tex, lines 66-71. (c) The audit’s finding, RESEARCH_DECISIONS.md, lines 68-69. (d) The revision that gives χ − 2, LITERATURE_AND_REVISION_REVIEW.md, line 107.',
        },
        'The K_{56} model is part of the paper, and a program checks it. It tests all 1,540 pairs of branch sets for an edge of H between them, using two checkers that do the arithmetic in different ways. As a negative control, swapping vertices 1 and 4 between two branch sets makes the check fail at the pair (0, 23) (Figure 2). The early draft and the audit are still in the project’s space, next to the records that replaced them.',
        {
          kind: 'film',
          id: 'figure-2',
          slug: 'clique-minors-independence-two',
          caption: 'The check of the K_{56} model, drawn from the certificate files: the 100 vertices of H grouped into 56 branch sets, the 1,540 pairs tested in the checker’s order, and the negative control. The placement of the vertices is schematic.',
        },
      ],
    },
    {
      id: 'publishing',
      title: 'Publishing',
      body: [
        'We publish on Zenodo, where every paper has a DOI and is released under CC BY 4.0. Each paper’s page on this site links to the PDF and the Zenodo record and lists what the paper shows and what it does not claim. The page also shows the paper’s space in Mantis.',
      ],
    },
  ],
};

export const lab = {
  title: 'About the lab',
  lede:
    'Mantis Discovery is a research group within Mantis, at MIT CSAIL. We use AI throughout our research and publish our results as papers on Zenodo.',
  researchers: '25+',
  researchersText: 'Researchers in mathematics, machine learning, physics, chemistry and biology work with us. They include PhD students and olympiad medalists.',
  joinTitle: 'Joining the lab',
  joinText:
    'If you’re a student who wants to do serious research with AI, or a researcher who’d like to try this in your own field, write to us and tell us what you work on.',
  joinAction: 'Write to us',
};

// The national olympiads the lab's researchers come from, shown as a row of logos on the home page.
// Official marks, turned white for the dark ground (public/brand/olympiads): the USAMO is run by the
// MAA, so its mark is the MAA's; the USAPhO selects the U.S. Physics Team, whose logo it uses.
export const olympiads = [
  { name: 'USAMO', full: 'USA Mathematical Olympiad', logo: asset('/brand/olympiads/maa.svg'), alt: 'Mathematical Association of America, which runs the USAMO', w: 300, h: 92 },
  { name: 'USAPhO', full: 'US Physics Olympiad', logo: asset('/brand/olympiads/uspt.png'), alt: 'U.S. Physics Team', w: 201, h: 125 },
  { name: 'USNCO', full: 'US National Chemistry Olympiad', logo: asset('/brand/olympiads/usnco.png'), alt: 'ACS U.S. National Chemistry Olympiad', w: 555, h: 120 },
  { name: 'USABO', full: 'USA Biolympiad', logo: asset('/brand/olympiads/usabo.png'), alt: 'USA Biolympiad', w: 350, h: 120 },
  { name: 'USACO', full: 'USA Computing Olympiad', logo: asset('/brand/olympiads/usaco.png'), alt: 'USA Computing Olympiad', w: 974, h: 120 },
];

// The team, listed on the Lab page. Leads first; everyone else alphabetically by first name. Bios are
// short paraphrases of what each person wrote about their own research on the lab's application form
// (22 Oct); people without one have not sent theirs yet.
/** `role` is a lead's title, shown under the name; `bio` opens on hover or focus. */
export type Member = { name: string; role?: string; bio?: string };
export const team: { leads: Member[]; members: Member[] } = {
  leads: [
    { name: 'Pranava Kumar', role: 'Founder and lead' },
    { name: 'Sushaan Kandukoori', role: 'Director of mathematics and machine learning', bio: 'Builds the AI that helps run the lab’s research in mathematics and machine learning.' },
    { name: 'Shrikrishna Ramesh', role: 'Director of chemistry and biology' },
  ],
  members: [
    { name: 'Abhay Varun Chittim Madhusudan', bio: 'Quantum robotics research assistant at Portland State University, using quantum fuzzy logic for balance and decisions in legged robots. Also programs autonomous robots for FIRST Tech Challenge.' },
    { name: 'Abhijay Gangarapu' },
    { name: 'Akash Gundimeda', bio: 'Single-cell biology. Built single-cell analysis tools into Mantis and integrated the FlyBase platform.' },
    { name: 'Aly Dhedhi', bio: 'Designs peptides that cross the blood-brain barrier to target glioblastoma. First author of a paper at IEEE CIBCB 2026.' },
    { name: 'Amy Wang', bio: 'Computational biology and genetics. Co-authored a paper in mAbs on predicting antibody purification, and is modeling how shear flow affects Tau aggregation.' },
    { name: 'Angelos Papadopoulos', bio: 'PhD researcher in computational biology. Built ParaSurf and AntiSite to predict protein binding sites, and designs antibodies with generative models.' },
    { name: 'Aniket Mangalampalli', bio: 'Works on knowledge graphs and medical image detection in Mantis. Earlier did light-sheet microscopy research on cortical layers at the MIT and Harvard LCN Lab.' },
    { name: 'Arhaan Shah', bio: 'Optimization theory for machine learning. Proved last-iterate convergence for AMSGrad-AA (under review at TMLR). On the Mantis embeddings team.' },
    { name: 'Ariba Naeem', bio: 'Bioinformatics. Fine-tunes protein language models to predict protein function, and studies how their embeddings capture evolution.' },
    { name: 'Devom Brahmbhatt' },
    { name: 'Dheeraj Bandi', bio: 'Quantum robotics at Portland State University. Found an exact way to measure what an entangling gate adds to a quadruped robot\'s choices, tested on a real Unitree Go2.' },
    { name: 'Edoardo Panella', bio: 'University student in mathematics and theoretical computer science. Tests whether neural combinatorial solvers beat classical heuristics, on Traveling Salesman instances set on geodesic terrain.' },
    { name: 'Griffin Consigli', bio: 'Machine learning. Recreated Google DeepMind\'s SynthID, the system that watermarks AI-generated content.' },
    { name: 'Ishaan Sharma', bio: 'Human-AI interaction. Showed with a UC Santa Cruz professor that duplicate documents mislead retrieval-augmented AI, and that removing them raises accuracy by 16.6 points.' },
    { name: 'Jude Ezeh', bio: 'Engineer with five years in data science and machine learning, including predictive models for healthcare and behavioral data. In Mantis, works on embeddings, knowledge graphs and agents for healthcare data.' },
    { name: 'Kaavin Prasanna', bio: 'Computational biology. Built MantisBrain, a gene-expression pipeline on the Mantis API, and worked on population genetics at Stanford\'s Rosenberg Lab.' },
    { name: 'Krish' },
    { name: 'Nam Nguyen', bio: 'Builds knowledge-graph and retrieval pipelines for AI agents in Mantis, and studies working memory in language models with Dartmouth.' },
    { name: 'Nischay Kommisetty', bio: 'USABO semifinalist. Designs protein binders in a lab at MIT and leads protein and drug discovery work on Mantis.' },
    { name: 'Parth Anand', bio: 'Mechanistic interpretability. Showed that rare and non-Western facts settle deeper inside transformers, and built a method to edit them. Emergent Ventures fellow.' },
    { name: 'Pranauv Muthuraman', bio: 'Builds applied AI systems. Compared variational quantum circuits with matched classical models across 105 runs (submitted to arXiv), and co-founded Holmes, an autonomous macOS agent.' },
    { name: 'Prithwish Ghosh', bio: 'Undergraduate researcher in machine learning: multi-agent reinforcement learning for railway traffic, NLP pipelines, and an EACL 2026 workshop paper.' },
    { name: 'Rohit Shenoy', bio: 'Language model safety. Studied at UC Santa Cruz how steering persona vectors changes when models refuse, and how that steering throws off automated attack scorers.' },
    { name: 'Taksh Kothari' },
    { name: 'Tarang Pande', bio: 'UIUC undergraduate applying machine learning to biology and computer systems, with five published papers across cardiology, drug discovery and neuroscience.' },
  ],
};

export const notFound = {
  title: 'Page not found',
  text: 'There’s no page at this address.',
  actions: [
    { href: '/', label: 'Home' },
    { href: '/research/', label: 'Read the papers' },
  ],
};

const Z = 'https://zenodo.org/records';
export const recordUrl = (p: Paper) => `${Z}/${p.record}`;
export const fileUrl = (p: Paper, name: string) => `${Z}/${p.record}/files/${encodeURIComponent(name)}?download=1`;
export const doiUrl = (p: Paper) => `https://doi.org/${p.doi}`;

export const papers: Paper[] = [
  {
    slug: 'opaque-sets-reach-bounds',
    tag: 'Opaque sets',
    short: 'Sharp reach bounds for opaque sets',
    record: 23484629,
    doi: '10.5281/zenodo.23484629',
    title: 'Sharp reach bounds and quantitative localization for opaque sets',
    field: 'mathematics',
    area: 'Discrete geometry',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Opaque_Sets.pdf', bytes: 438502, pages: 15 }],
    summary:
      'We prove two sharp inequalities for barriers that block every line through the unit square, and show what any barrier shorter than √2 + √6/2 must look like.',
    shows: [
      'A set containing two adjacent corners of the unit square has length, plus its convex-hull distances to the other corners, at least Λ = √2 + √6/2.',
      'The bounds extend to finite chains of component hulls and apply to every closed opaque set of finite length, whatever its number of components or location.',
      'Any barrier shorter than Λ has either four distinct corner components, or one component through an adjacent pair and two more, one through each remaining corner.',
      'Exact arithmetic verifies the algebraic inequalities for all 105 six-leaf topologies and all 45 five/four-leaf pairs.',
    ],
    limits: ['The remaining configurations are still open, and so is the unrestricted lower bound for the square itself.'],
    abstract: [
      'Let Q be the unit square and put Λ = √2 + √6/2. We prove two sharp inequalities for finite-length continua in the plane. A set containing two adjacent corners has length, plus its convex-hull distances to the other corners, at least Λ. A corresponding inequality holds for two sets whose hulls meet and which together contain three corners. These bounds extend to finite chains of component hulls, with coefficient one on the total distance between consecutive hulls.',
      'The argument also allows missing projection intervals and applies to every closed opaque set of finite length, regardless of its number of components or its location. After the corners are adjoined, any such barrier shorter than Λ has either four distinct corner components or one component containing an adjacent pair and two further components, one through each remaining corner. In the latter case, we obtain positive lower bounds on the path distances between the three hulls. A tree replacement argument rules out some configurations in the former case. Exact arithmetic verifies the algebraic inequalities for all 105 six-leaf topologies and all 45 five/four-leaf pairs. The other configurations, and the unrestricted lower bound for the square, remain open.',
    ],
    figure: {
      id: 'opaque',
      alt: 'The unit square as a slab with the classic opaque fence standing on it. Lines cross the square and every one stops at the fence. A set through two corners follows, with its hull and its distances to the other corners adding up to at least √2 + √6/2. Then 150 tiles turn over as the cases are checked, and a number line shows the open gap between 2.00006 and 2.6390.',
      beats: [
        'Every line that crosses the square hits this fence. Its length is √2 + √6/2, the shortest known.',
        'For any set through two adjacent corners, its length plus its hull’s distances to the other two corners is at least √2 + √6/2. The classic fence hits that bound exactly.',
        'The proof comes down to 150 cases, and a program checks each one in exact arithmetic.',
        'The shortest possible fence is not known. Its length is between 2.00006 and 2.6390.',
      ],
    },
    mantis: {
      records: 1433,
      uses: ['map', 'trace', 'certificate'],
      still: still('space-opaque', 'The opaque sets space in Mantis, with one record open: a falsified inequality about shortest networks, marked do not retry.', 'The opaque sets space holds 1,433 records. The open one is a falsified inequality, kept with the counterexample that broke it: the equilateral triangle gives 0.7321 < 0.8660.'),
    },
  },
  {
    slug: 'clique-minors-independence-two',
    tag: 'Clique minors',
    short: 'Clique minors and fractional clique covers',
    record: 23484533,
    doi: '10.5281/zenodo.23484533',
    title: 'Clique minors and fractional clique covers in graphs with independence number two',
    field: 'mathematics',
    area: 'Graph theory',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Clique_Minors.pdf', bytes: 313647, pages: 11 }],
    summary:
      'For graphs with independence number two, we turn clique-minor bounds into chromatic bounds without accumulating error, and apply them to Hadwiger’s conjecture.',
    shows: [
      'Every graph G with α(G) ≤ 2 has an odd-order induced subgraph F and an integer b ≥ 0 with χ(G) = b + (|F| + 1)/2 and h(G) ≥ b + h(F).',
      'Fractional clique covering number at most four implies h(G) ≥ χ(G) − 1, and θ_{f}(G) < 31/8 implies Hadwiger’s inequality.',
      'For the complement H of the Higman-Sims graph: h(H[w]) ≥ ⌊(24χ(H[w]) − 12)/25⌋ for every clique inflation, and h(H[S]) ≥ χ(H[S]) − 2 for every induced subgraph.',
    ],
    limits: ['Hadwiger’s inequality itself is reached only below fractional clique covering number 31/8.'],
    abstract: [
      'For graphs with independence number at most two, we convert bounds on clique minors in terms of order into chromatic bounds without accumulating an error across the join factors of a critical graph. Every such graph G has an odd-order induced subgraph F and an integer b ≥ 0 such that χ(G) = b + (|F| + 1)/2 and h(G) ≥ b + h(F). Consequently, the largest hereditary deficit χ − h equals the largest hereditary deficit ⌈|V|/2⌉ − h. Combining this reduction with the Chudnovsky-Seymour half-order bound gives h(G) ≥ ⌊((2 + 4 min{1/4, 1/T})/3)(χ(G) − 1/2)⌋ when θ_{f}(G) ≤ T.',
      'Thus fractional clique covering number at most four implies h(G) ≥ χ(G) − 1, while θ_{f}(G) < 31/8 implies Hadwiger’s inequality. For each T < 4, any counterexample with θ_{f}(G) ≤ T contains an induced counterexample whose order is bounded in terms of T. Applied to the complement H of the Higman-Sims graph, the method yields h(H[w]) ≥ ⌊(24χ(H[w]) − 12)/25⌋ for every clique inflation and h(H[S]) ≥ χ(H[S]) − 2 for every induced subgraph.',
    ],
    figure: {
      id: 'clique',
      alt: 'One hundred points on a sphere gather into 56 groups. Lines then join every pair of groups, 1,540 in all, until the sphere is full. Last, two vertices trade places and the check stops at the pair (0, 23).',
      beats: [
        'The paper’s certificate splits the 100 vertices of H, the complement of the Higman-Sims graph, into 56 connected groups: 12 single vertices and 44 pairs joined by an edge.',
        'A program checks all 1,540 pairs of groups for an edge between them. Every pair has one, so H has a K_{56} minor.',
        'As a control we swap vertices 1 and 4 between two groups. The checker then stops at the first pair with no edge, (0, 23).',
      ],
    },
    mantis: {
      records: 4459,
      uses: ['map', 'trace', 'audit', 'certificate'],
      still: still('space-clique', 'The clique minors space in Mantis, searched for the word counterexample: 269 records light up across the map.', 'Searching the clique minors space for “counterexample” lights up 269 records.'),
    },
    story: { href: '/method/#example', label: 'How this bound was developed' },
  },
  {
    slug: 'zonal-gyrokinetic-stationary-response',
    tag: 'Gyrokinetics',
    short: 'Stationary response in a zonal gyrokinetic model',
    record: 23484800,
    doi: '10.5281/zenodo.23484800',
    title: 'Stationary response and singular limits in a linear zonal gyrokinetic model',
    field: 'physics',
    area: 'Plasma physics',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Stationary_Response_Gyrokinetics.pdf', bytes: 439350, pages: 21 }],
    summary:
      'We derive the stationary response of a linear periodic gyrokinetic model without assuming uniform kinetic relaxation, and show that two of its limits do not commute.',
    shows: [
      'When the quadratic energy is coercive, the energy-orthogonal stationary projection is determined by the field operator D_{0} = C − R∗ΠR.',
      'Cesàro and Abel means converge strongly, but their operator-norm errors remain one when nonzero frequencies accumulate at zero.',
      'The long-time and zero-detuning limits do not commute.',
      'One coercive regularization of constrained initial data has an O(√ε) error bound in the energy coordinate.',
    ],
    limits: [
      'The 23.2% change from ordinary orbit averaging is stable under the reported grid refinements and is not a certified continuum value.',
      'Unrestricted initial data retain fast charge oscillations.',
    ],
    abstract: [
      'We derive the stationary response of a linear periodic gyrokinetic model without assuming uniform kinetic relaxation. When the quadratic energy is coercive, the energy-orthogonal stationary projection is determined by the field operator D_{0} = C − R∗ΠR. Cesàro and Abel means converge strongly, but their operator-norm errors remain one when nonzero frequencies accumulate at zero. Adding the same constant drift detuning to every species removes the stationary space and generates a slow unitary evolution on its former kernel, so the long-time and zero-detuning limits do not commute.',
      'At vanishing polarization, a homogeneous kinetic-species model instead imposes charge and current constraints. We construct a self-adjoint evolution on the continuous-velocity constraint space and prove an O(√ε) error bound, in the energy coordinate, for one coercive regularization of constrained initial data; unrestricted data retain fast charge oscillations. In a specified 25-dimensional orbit discretization with trapped and passing particles, replacing the energy projection by ordinary orbit averaging changes the stationary field by 23.2%. The projection and singular-limit results are analytical; the percentage is stable under the reported grid refinements and is not a certified continuum value.',
    ],
    figure: {
      id: 'gyro',
      alt: 'A torus cut open to show three nested surfaces, with passing particles circling it and trapped particles bouncing on its outer side. Then the time average of a slow rotation as a surface: one path along its ridge ends at 1, another dies away to 0. Last, two arrows 23.2% apart.',
      beats: [
        'In a torus, passing particles go all the way around, while trapped particles bounce back and forth on the outer side. The paper’s model includes both.',
        'The time average of a slow rotation goes to 0 as time grows. If the detuning is set to zero first, the average stays at 1, so the two limits do not commute.',
        'In the paper’s 25-dimensional model, replacing the energy projection with ordinary orbit averaging moves the stationary field by 23.2%.',
      ],
    },
    mantis: {
      records: 1579,
      uses: ['map', 'trace'],
      still: still('space-gyro', 'The gyrokinetics space in Mantis, with one record open: moving 2×2 blocks defeat operator-norm averaging.', 'The gyrokinetics space holds 1,579 records. The open one is a counterexample kept on file: moving 2 × 2 blocks leave an order-one error in operator-norm averaging.'),
    },
  },
  {
    slug: 'elliptic-solvers-locality',
    tag: 'Elliptic solvers',
    record: 23484455,
    doi: '10.5281/zenodo.23484455',
    title: 'Locality and global information in elliptic solvers',
    field: 'machine-learning',
    area: 'Scientific machine learning',
    published: '2026-10-19',
    files: [
      { label: 'Paper', name: 'Elliptic Solvers.pdf', bytes: 353219, pages: 13 },
      { label: 'Supplement', name: 'supplement (1).pdf', bytes: 334600, pages: 13 },
    ],
    summary:
      'A local approximation to an elliptic inverse needs on the order of n^{d}/(w + 1)^{d} shared coordinates of global information, and a linear construction achieves this.',
    shows: [
      'For the Dirichlet Laplacian on an n^{d} grid, uniform relative energy error at any fixed tolerance below one requires order n^{d}/(w + 1)^{d} shared coordinates, where w is the local radius, and a linear construction attains this order.',
      'For a prescribed linear measurement map, the proof gives an explicit pair of inputs that the solver cannot distinguish.',
    ],
    limits: [
      'A learned model with 16 sine moments errs by 67.0% on white forcings, against 6.1% on smooth ones.',
      'No tested learned initial guess cut median end-to-end solve time on the largest timed grid.',
    ],
    abstract: [
      'We study how much global information a local approximation to an elliptic inverse needs. At each grid point, the solver receives nearby right-hand-side values and a continuous encoding of the full input; both the encoder and reconstruction may be nonlinear. For the Dirichlet Laplacian on an n^{d} grid, uniform relative energy error at any fixed tolerance below one requires order n^{d}/(w + 1)^{d} shared coordinates, where w is the local radius. A linear construction attains this order. We give finite bounds, leading constants as the tolerance approaches one, and a tradeoff between cumulative local propagation and the total dimension of global messages.',
      'The lower bound combines a Borsuk-Ulam argument with canonical correlations of the Green matrix. For a prescribed linear measurement map, it also gives an explicit pair of inputs that the solver cannot distinguish. Experiments on the two-dimensional Poisson problem compare local convolutional, moment-based, Fourier, and multiscale models. A model using 16 sine moments has mean energy error 6.1% on smooth forcings and 67.0% on white forcings at the training resolution. Broader training reduces some of this gap, whereas none of the tested learned initial guesses reduces median end-to-end solve time at the largest timed grid.',
    ],
    figure: {
      id: 'elliptic',
      alt: 'A 32 × 32 grid of bars shows the discrete Green’s function at a point p, tallest at p, with a 7 × 7 window around it; 79.9% of the response lies outside the window. The grid then splits into 64 blocks with one marker each, and last shows a smooth forcing and a white-noise forcing beside an error gauge at 6.1% and 67.0%.',
      beats: [
        'The solution at p depends on the forcing at every point of the grid. With uniform forcing, 79.9% of it comes from outside the 7 × 7 window around p.',
        'A solver that only looks nearby also needs some numbers shared across the whole grid: on the order of one per (w + 1) × (w + 1) block, here 64. A linear construction works with that many.',
        'A learned model with 16 sine moments is off by 6.1% on smooth forcings and by 67.0% on white noise.',
      ],
    },
    mantis: {
      records: 3122,
      uses: ['map', 'trace'],
      still: still('space-elliptic', 'The elliptic solvers space in Mantis, with one record open: every observed pair error exceeds its predicted lower value.', 'The elliptic solvers space holds 3,122 records. The open one checks saved experiments against the bound: at n = 63 and m = 16, the observed pair error of 1.321 is above the predicted 0.460.'),
    },
  },
];

/** The 404's figure. */
export const voidFigure: Figure = {
  id: 'void',
  alt: 'An empty square. Lines cross it from every direction and none of them is stopped.',
  beats: ['No barrier, so every line goes straight through.'],
};

// Work in progress: the lab's other projects, one poster each (posters/, built by `sh posters/build.sh` into
// public/media/posters/). Their Zenodo records stay off the site and nothing here links to them; a poster
// gives the question, the approach, results so far and open questions. Titles and fields match the posters.
export const workInProgress = {
  title: 'Work in progress',
  lede: 'We are still working on these projects. Each poster describes the problem and the results we have so far.',
  link: { href: '/research/#work-in-progress', label: 'Work in progress' },
};
export type Poster = { slug: string; title: string; field: string; area: string };
export const posters: Poster[] = [
  { slug: 'sidon-subsets', title: 'Sidon subsets through random rounding', field: 'Mathematics', area: 'Additive combinatorics' },
  { slug: 'matching-cofactors', title: 'Inertia of matching cofactor matrices', field: 'Mathematics', area: 'Algebraic combinatorics' },
  { slug: 'constrained-permanents', title: 'Critical points of the permanent with fixed row and column sums', field: 'Mathematics', area: 'Real algebraic geometry' },
  { slug: 'ascent-sequences', title: 'Growth of pattern-avoiding ascent sequences', field: 'Mathematics', area: 'Enumerative combinatorics' },
  { slug: 'log-sobolev-stability', title: 'Stability of the Gaussian log-Sobolev inequality', field: 'Mathematics', area: 'Analysis and probability' },
  { slug: 'gyrokinetic-boundary-spectra', title: 'Slow particles and weak collisions in gyrokinetics', field: 'Physics', area: 'Plasma physics' },
  { slug: 'gibbs-covariance', title: 'Relative covariance in discrete Gibbs models', field: 'Machine learning', area: 'Probabilistic models' },
  { slug: 'regression-coresets', title: 'What a weighted subset of the data can fit', field: 'Machine learning', area: 'Learning theory' },
  { slug: 'calibration-limits', title: 'What calibration tells mixed-precision quantization', field: 'Machine learning', area: 'Model compression' },
  { slug: 'certified-compression', title: 'Certified compression of endgame tables', field: 'Computer science', area: 'Games and verification' },
  { slug: 'repetition-deadlines', title: 'Repetition under a deadline', field: 'Computer science', area: 'Games and algorithms' },
  { slug: 'dissociated-irreducibles', title: 'Dissociated sets of irreducible polynomials', field: 'Mathematics', area: 'Number theory' },
  { slug: 'integer-optima-periods', title: 'Periods and rounding in integer optimization', field: 'Mathematics', area: 'Number theory and optimization' },
  { slug: 'edge-pair-correlations', title: 'Pairs of eigenvalues at the edge of a spectrum', field: 'Mathematics', area: 'Random matrix theory' },
  { slug: 'survival-state-bounds', title: 'Cell-state bounds when treatment kills cells', field: 'Biology', area: 'Single-cell statistics' },
  { slug: 'clone-composition', title: 'Predicting clone composition from relatives', field: 'Biology', area: 'Single-cell lineage tracing' },
  { slug: 'ns4a-candidates', title: 'Ranking LIR-like candidates in a viral protein', field: 'Biology', area: 'Virology' },
];
/** A poster's PDF, and its preview at 1152 px wide ('lg') or 576 px ('sm'). */
export const posterPdf = (p: Poster) => asset(`/media/posters/${p.slug}.pdf`);
export const posterPreview = (p: Poster, size: 'sm' | 'lg') => asset(`/media/posters/${p.slug}${size === 'sm' ? '-sm' : ''}.webp`);

export const paperBySlug = (slug: string) => papers.find((p) => p.slug === slug);
export const fieldLabel = (f: Field) => fields.find((x) => x.id === f)!.label;

/** Plain-text version of a string with ^{…}/_{…} markup, for meta tags and aria labels. */
export function plain(s: string) {
  const sup: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '/': 'ᐟ', d: 'ᵈ', m: 'ᵐ', n: 'ⁿ' };
  const sub: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', m: 'ₘ', f: 'f' };
  return s
    .replace(/\^\{([^}]*)\}/g, (_, t: string) => [...t].map((c) => sup[c] ?? c).join(''))
    .replace(/_\{([^}]*)\}/g, (_, t: string) => [...t].map((c) => sub[c] ?? c).join(''));
}
