// All visible content lives here.
//
// Sources: the 15 Zenodo records the owner listed (metadata via the Zenodo API, abstracts transcribed
// from the PDFs on 21 Oct 2026). "25+ researchers, including olympiad medalists" is the owner's own
// description; the group also includes PhD students, so the copy never calls it a student group (22 Oct).
//
// Assumptions and placeholders (each marked `placeholder` below):
// - The team (team, below) is the owner's list plus everyone who answered the lab's sign-up form; bios
//   come only from each person's research answer.
// - The owner says the lab produced 20+ papers; only the 15 linked records are listed here.
// - Record 23484622 currently serves the PDF of record 23484607 (identical file), so its page shows
//   title and DOI only. Fill `abstract`, `shows` and `limits` once the record is corrected.
// - None of the 15 papers is in biology. The mission names biology because the lab works there;
//   the archive only shows fields that have papers.
// - Discovery uses the Mantis mark, faces and palette (mantis.csail.mit.edu). The owner confirmed the
//   MIT CSAIL affiliation; "part of Mantis" in the footer is the remaining wording to confirm.
//
// Markup in strings: ^{…} is a superscript, _{…} a subscript (rendered by <Tex>).

/** A file from public/, under the path the site is served from (/MantisDiscovery on GitHub Pages). */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;

export type Field = 'mathematics' | 'machine-learning' | 'physics' | 'computer-science';

export const fields: { id: Field; label: string }[] = [
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'machine-learning', label: 'Machine learning' },
  { id: 'physics', label: 'Physics' },
  { id: 'computer-science', label: 'Computer science' },
];

export type PlateId =
  | 'sidon' | 'gk-stationary' | 'gk-boundary' | 'opaque' | 'matching' | 'repetition' | 'log-sobolev'
  | 'permanents' | 'certified' | 'clique' | 'ascent' | 'coresets' | 'elliptic' | 'gibbs' | 'calibration'
  | 'void';

export type Paper = {
  slug: string;
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
  plate: PlateId;
  figure: string; // what the computed figure draws and checks (alt text)
  placeholder?: boolean;
};

export const site = {
  name: 'Mantis Discovery',
  role: 'Open problems, taken on with AI',
  // Where the site is published (canonical URLs, Open Graph, sitemap): the deploy workflow passes the
  // GitHub Pages address, or a custom domain once one is set up.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kellislab.github.io/MantisDiscovery',
  description:
    'Mantis Discovery is a research group at MIT CSAIL using AI and the Mantis platform on open problems in mathematics, machine learning, physics and biology.',
  email: 'pranavak@mit.edu',
  zenodo: 'https://zenodo.org/search?q=metadata.creators.person_or_org.name%3A%22Mantis%20Discovery%22',
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
  title: 'Open problems, taken on with AI.',
  lede:
    'We work in mathematics, machine learning, physics and biology. AI is involved throughout the research, from reading the literature to running experiments, with the brightest young minds guiding every step of the way.',
  actions: [
    { href: '/research/', label: 'Read the papers' },
    { href: '/method/', label: 'How we work with AI' },
  ],
  statementTitle: 'Built on Mantis',
  statement:
    'Mantis, the knowledge platform from MIT CSAIL, maps papers, data and code into one space that people and AI agents work in together. We use it on open problems in mathematics, physics, machine learning and biology. Agents read the literature, suggest next steps and run computations, and every claim stays linked to the sources and results behind it, so anyone can trace a finding back to where it came from.',
  archiveTitle: 'Research',
  archiveLede: 'Fifteen papers so far, all free to read on Zenodo.',
  labTitle: 'Worked on by the brightest young minds',
  labText: 'Our researchers range from olympiad medalists to PhD students.',
  medalists: 'Researchers, including medalists from',
  labAction: { href: '/lab/', label: 'Meet the lab' },
};

export const film = {
  title: 'A walkthrough',
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

// The Mantis demo beside "Built on Mantis", from mantis.csail.mit.edu (agent-inspector).
export const mantisDemo = {
  src: asset('/media/mantis-agent-inspector.mp4'),
  poster: asset('/media/mantis-agent-inspector.jpg'),
  label: 'A Mantis workspace: an agent at work on a map of course topics, with its narrator, tree and inspector panels.',
};

export const method = {
  title: 'How a result gets made',
  lede:
    'Researchers run every project. AI helps at each stage below, but the decisions stay with people, including what to work on and whether a result holds up.',
  stages: [
    {
      id: 'review',
      name: 'Review',
      ai: 'Reads what has been published on the problem and summarizes what is proved, what is conjectured and where the best bounds stand.',
      people: 'Pick the area and the kind of problem, and correct anything the AI got wrong about the literature.',
    },
    {
      id: 'question',
      name: 'Question',
      ai: 'Suggests open questions that look tractable, and says why an answer would matter.',
      people: 'Choose the question, and write down what may be assumed and what would count as an answer.',
    },
    {
      id: 'attempt',
      name: 'Attempt',
      ai: 'Works on proofs and constructions, or designs an experiment, writes the code and runs it.',
      people: 'Step in when an approach stalls, and decide when to change direction.',
    },
    {
      id: 'analyze',
      name: 'Analyze',
      ai: 'Goes back over the results looking for the weakest step, and tests the claim at its edges.',
      people: 'Read the argument line by line, the way a referee would.',
    },
    {
      id: 'check',
      name: 'Check',
      ai: 'Turns finite case checks into exact computations, and reruns experiments with the reported settings.',
      people: 'Sign off only on what someone outside the lab could verify, and write the limits into the abstract.',
    },
  ],
  standardsTitle: 'What counts as a result',
  standards: [
    {
      name: 'Proofs that hold up',
      text: 'A math claim needs a complete proof. When a proof comes down to finitely many cases, we check every case exactly, by computer.',
      quote: 'Exact arithmetic verifies the algebraic inequalities for all 105 six-leaf topologies and all 45 five/four-leaf pairs.',
      slug: 'opaque-sets-reach-bounds',
    },
    {
      name: 'Experiments that replicate',
      text: 'An experimental result has to survive the tests people in that field would run, and the paper has to say how it was tested.',
      quote: 'Exhaustive evaluation of 25 small trained networks separates approximation bias, sampling variance, and omissions from a shortlist.',
      slug: 'mixed-precision-calibration-limits',
    },
    {
      name: 'Limits written down',
      text: 'Every abstract says what the result doesn’t cover.',
      quote: 'These conclusions concern the displayed linear realizations and the full distribution norm.',
      slug: 'gyrokinetic-boundary-spectra',
    },
    {
      name: 'Everything public',
      text: 'Every paper is on Zenodo with a DOI, under CC BY 4.0. Anyone can read it, cite it or build on it.',
      quote: 'A chess implementation using the existing paired grids stores 26 complete pawnless classes in 7,585,632 bytes. All files pass endpoint certification.',
      slug: 'certified-compression-game-tables',
    },
  ],
};

export const lab = {
  title: 'About the lab',
  lede:
    'Mantis Discovery is a research group within Mantis, at MIT CSAIL. We use AI throughout our research, and we hold what comes out of it to the same standard as any other paper in the field.',
  researchers: '25+',
  researchersText: 'Researchers in mathematics, machine learning, physics and biology, including PhD students and olympiad medalists.',
  work: [
    { name: 'Picking problems', text: 'Most of what the AI suggests, we don’t pursue. A researcher has to think a question is worth weeks of work before it starts.' },
    { name: 'Setting ground rules', text: 'Before a project starts we write down what can be assumed, which methods are off the table, and what would count as an answer.' },
    { name: 'Checking the work', text: 'Every claim is read by someone who didn’t write it, and the paper has to say plainly where the result stops.' },
  ],
  joinTitle: 'Get in touch',
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
export type Member = { name: string; bio?: string };
export const team: { leads: Member[]; members: Member[] } = {
  leads: [
    { name: 'Pranava Kumar', bio: 'Co-leads Mantis Discovery.' },
    { name: 'Shrikrishna Ramesh', bio: 'Co-leads Mantis Discovery.' },
    { name: 'Sushaan Kandukoori', bio: 'Co-leads Mantis Discovery, building AI that helps run research in mathematics, machine learning, physics and biology.' },
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
  title: 'Open problem',
  text: 'There’s no page at this address. This square has no barrier, so every line goes straight through it.',
  actions: [
    { href: '/', label: 'Back to the start' },
    { href: '/research/', label: 'Read the papers' },
  ],
};

const Z = 'https://zenodo.org/records';
export const recordUrl = (p: Paper) => `${Z}/${p.record}`;
export const fileUrl = (p: Paper, name: string) => `${Z}/${p.record}/files/${encodeURIComponent(name)}?download=1`;
export const doiUrl = (p: Paper) => `https://doi.org/${p.doi}`;

export const papers: Paper[] = [
  {
    slug: 'sidon-subsets-rounding-morphism',
    short: 'Sidon subsets and codes with separated pair-sums',
    record: 23484825,
    doi: '10.5281/zenodo.23484825',
    title: 'A rounding morphism for additive structure: Sidon subsets and codes with separated pair-sums',
    field: 'mathematics',
    area: 'Additive combinatorics',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Sidon_Mantis_Discovery.pdf', bytes: 271509, pages: 21 }],
    summary:
      'Every N-point set in a torsion-free abelian group has a Sidon subset of size at least (2/(3√3) − o(1))√N, twice the previous best constant.',
    shows: [
      'Every N-point subset A of a torsion-free abelian group has a Sidon subset of size at least (2/(3√3) − o(1))√N, uniformly in the group and in ℝ^{d}.',
      'Rounding A into ℤ_{m} at random is additive on every additive quadruple up to a defect of at most one bucket, in every dimension and every draw.',
      'A code tolerating perturbations of magnitude t satisfies (t + 1)(k(k − 1) + 1) ≤ m, with equality exactly at translated (t + 1)-fold dilates of planar difference sets.',
    ],
    limits: [
      'Using only |A| and the collision law, no argument of this kind passes 2/(3√3), even with a measurable Sidon system in place of the code.',
    ],
    abstract: [
      'For finite A in a torsion-free abelian group let ‖A‖ be the largest size of a Sidon subset of A, and ℓ(N) = min{‖A‖ : |A| = N}. We prove ℓ(N) ≥ (2/(3√3) − o(1))√N, twice Bailleul and Riblet’s constant. Rounding A into ℤ_{m} at random is additive on every additive quadruple up to a defect of at most one bucket, in every dimension and every draw; in one dimension, with random scale, the pairwise collision probability is exactly 1/m. A code from a planar difference set absorbs the defect, avoiding the restriction to half of A that earlier arguments pay.',
      'A code tolerating perturbations of magnitude t satisfies (t + 1)(k(k − 1) + 1) ≤ m, with equality exactly at translated (t + 1)-fold dilates of planar difference sets. This also bounds the method: using only |A| and the collision law, no such argument passes 2/(3√3), even with a measurable Sidon system in place of the code. Plain reduction modulo m has no defect; we weaken its diameter hypothesis to a condition on the image of A modulo m, and bound what a second point per fiber gains.',
    ],
    plate: 'sidon',
    figure:
      'A planar difference set: six points on a circle of 31 residues, joined by fifteen chords. Every nonzero difference modulo 31 occurs exactly once, which the figure checks as it draws.',
  },
  {
    slug: 'zonal-gyrokinetic-stationary-response',
    short: 'Stationary response in a zonal gyrokinetic model',
    record: 23484800,
    doi: '10.5281/zenodo.23484800',
    title: 'Stationary response and singular limits in a linear zonal gyrokinetic model',
    field: 'physics',
    area: 'Plasma physics',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Stationary_Response_Gyrokinetics.pdf', bytes: 439350, pages: 21 }],
    summary:
      'The stationary response of a linear periodic gyrokinetic model, derived without assuming uniform kinetic relaxation, and two limits that do not commute.',
    shows: [
      'When the quadratic energy is coercive, the energy-orthogonal stationary projection is determined by the field operator D_{0} = C − R∗ΠR.',
      'Cesàro and Abel means converge strongly, but their operator-norm errors remain one when nonzero frequencies accumulate at zero.',
      'The long-time and zero-detuning limits do not commute.',
      'An O(√ε) error bound, in the energy coordinate, for one coercive regularization of constrained initial data.',
    ],
    limits: [
      'The 23.2% change from ordinary orbit averaging is stable under the reported grid refinements and is not a certified continuum value.',
      'Unrestricted initial data retain fast charge oscillations.',
    ],
    abstract: [
      'We derive the stationary response of a linear periodic gyrokinetic model without assuming uniform kinetic relaxation. When the quadratic energy is coercive, the energy-orthogonal stationary projection is determined by the field operator D_{0} = C − R∗ΠR. Cesàro and Abel means converge strongly, but their operator-norm errors remain one when nonzero frequencies accumulate at zero. Adding the same constant drift detuning to every species removes the stationary space and generates a slow unitary evolution on its former kernel, so the long-time and zero-detuning limits do not commute.',
      'At vanishing polarization, a homogeneous kinetic-species model instead imposes charge and current constraints. We construct a self-adjoint evolution on the continuous-velocity constraint space and prove an O(√ε) error bound, in the energy coordinate, for one coercive regularization of constrained initial data; unrestricted data retain fast charge oscillations. In a specified 25-dimensional orbit discretization with trapped and passing particles, replacing the energy projection by ordinary orbit averaging changes the stationary field by 23.2%. The projection and singular-limit results are analytical; the percentage is stable under the reported grid refinements and is not a certified continuum value.',
    ],
    plate: 'gk-stationary',
    figure:
      'A poloidal cross-section of a torus: nested flux surfaces, passing orbits that circle all the way round, and trapped banana orbits that bounce on the outboard side. Guiding centers move along each orbit while the trapped fraction at the outboard midplane is sampled live against the exact √(2ε/(1 + ε)) = 67.9% for ε = 0.3.',
  },
  {
    slug: 'gyrokinetic-boundary-spectra',
    short: 'Boundary spectra in electrostatic gyrokinetics',
    record: 23484782,
    doi: '10.5281/zenodo.23484782',
    title: 'Boundary spectra and weak collisional relaxation in an electrostatic gyrokinetic model',
    field: 'physics',
    area: 'Plasma physics',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Boundary_Spectra_Gyrokinetics.pdf', bytes: 485037, pages: 24 }],
    summary:
      'Slow particles keep unresolved states from decaying uniformly in a linear electrostatic gyrokinetic model, and quasineutral coupling does not remove that.',
    shows: [
      'Quasineutral coupling does not remove the obstruction created by slow particles when the quadratic energy operator is coercive.',
      'The undriven spectrum is the closed left half-plane for zero inflow and the imaginary axis for periodic boundaries.',
      'For a Maxwellian velocity diffusion and a one-species linearized Coulomb model, differentiated wave packets give residuals bounded by C(ν^{1/3} + ν^{1/5}|ω|^{2/5}) at bounded frequencies.',
    ],
    limits: [
      'The conclusions concern the displayed linear realizations and the full distribution norm.',
      'Concentration near the passing boundary is shown under a stated nondegeneracy condition.',
    ],
    abstract: [
      'Can collisionless transport or weak collisions make unresolved states decay uniformly in a linear electrostatic gyrokinetic model? We show that quasineutral coupling does not remove the obstruction created by slow particles when the quadratic energy operator is coercive. Infinite-dimensional subspaces have uniformly vanishing field response, and the undriven spectrum is the closed left half-plane for zero inflow and the imaginary axis for periodic boundaries.',
      'Under a stated nondegeneracy condition on coupling to the remaining velocity region, asymptotically passing approximate eigenvectors on the imaginary axis have vanishing field and concentrate near the passing boundary. For a Maxwellian velocity diffusion and a one-species linearized Coulomb model, differentiated wave packets give residuals bounded by C(ν^{1/3} + ν^{1/5}|ω|^{2/5}) at bounded frequencies. If one species also has the required low-energy drift parity and an even gyroaverage, field feedback and any fixed number of bounded scalar observations cannot yield a positive decay rate uniform in ν with a fixed semigroup bound. These conclusions concern the displayed linear realizations and the full distribution norm.',
    ],
    plate: 'gk-boundary',
    figure:
      'The complex plane: the closed left half-plane hatched as the undriven spectrum for zero inflow, the imaginary axis (the spectrum for periodic boundaries) in ink, and approximate eigenvalues on it with residual discs of radius ν^{1/3} + ν^{1/5}|ω|^{2/5} (constant taken as 1), computed live as the collision rate ν falls.',
  },
  {
    slug: 'opaque-sets-reach-bounds',
    short: 'Sharp reach bounds for opaque sets',
    record: 23484629,
    doi: '10.5281/zenodo.23484629',
    title: 'Sharp reach bounds and quantitative localization for opaque sets',
    field: 'mathematics',
    area: 'Discrete geometry',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Opaque_Sets.pdf', bytes: 438502, pages: 15 }],
    summary:
      'Two sharp inequalities for barriers that block every line through the unit square, and the structure any barrier shorter than √2 + √6/2 must have.',
    shows: [
      'A set containing two adjacent corners of the unit square has length, plus its convex-hull distances to the other corners, at least Λ = √2 + √6/2.',
      'The bounds extend to finite chains of component hulls and apply to every closed opaque set of finite length, whatever its number of components or location.',
      'Any barrier shorter than Λ has either four distinct corner components, or one component through an adjacent pair and two more, one through each remaining corner.',
      'Exact arithmetic verifies the algebraic inequalities for all 105 six-leaf topologies and all 45 five/four-leaf pairs.',
    ],
    limits: ['Still open: the remaining configurations, and the unrestricted lower bound for the square itself.'],
    abstract: [
      'Let Q be the unit square and put Λ = √2 + √6/2. We prove two sharp inequalities for finite-length continua in the plane. A set containing two adjacent corners has length, plus its convex-hull distances to the other corners, at least Λ. A corresponding inequality holds for two sets whose hulls meet and which together contain three corners. These bounds extend to finite chains of component hulls, with coefficient one on the total distance between consecutive hulls.',
      'The argument also allows missing projection intervals and applies to every closed opaque set of finite length, regardless of its number of components or its location. After the corners are adjoined, any such barrier shorter than Λ has either four distinct corner components or one component containing an adjacent pair and two further components, one through each remaining corner. In the latter case, we obtain positive lower bounds on the path distances between the three hulls. A tree replacement argument rules out some configurations in the former case. Exact arithmetic verifies the algebraic inequalities for all 105 six-leaf topologies and all 45 five/four-leaf pairs. The other configurations, and the unrestricted lower bound for the square, remain open.',
    ],
    plate: 'opaque',
    figure:
      'The unit square with the shortest known opaque barrier: a Steiner tree joining three corners plus a segment from the fourth corner to the center, total length √2 + √6/2 = 2.6389. Random lines through the square are tested against the barrier as they are drawn.',
  },
  {
    slug: 'matching-cofactor-inertia',
    record: 23484622,
    doi: '10.5281/zenodo.23484622',
    title: 'The inertia of matching cofactor matrices',
    field: 'mathematics',
    area: 'Algebraic combinatorics',
    published: '2026-10-19',
    files: [],
    summary: 'A Mantis Discovery paper on matching cofactor matrices, open on Zenodo under CC BY 4.0.',
    shows: [],
    limits: [],
    abstract: null,
    plate: 'matching',
    figure:
      'The three-dimensional cube graph with its perfect matchings drawn one at a time. The figure enumerates them live and finds nine.',
    placeholder: true,
  },
  {
    slug: 'repetition-under-a-deadline',
    short: 'Repetition under a deadline',
    record: 23484607,
    doi: '10.5281/zenodo.23484607',
    title: 'Repetition under a deadline: memory bounds and capacity profiles',
    field: 'computer-science',
    area: 'Games and algorithms',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'repitition_deadline.pdf', bytes: 303951, pages: 17 }],
    summary:
      'How much history exact value monitoring needs when repetition claims and expiring budgets interact on a game graph, with matching memory bounds.',
    shows: [
      'Exact online value monitoring needs no history memory when H ≤ 2k − 2. Otherwise it requires Θ(min{N log k, log (N + S choose S)}) bits, with S = (H − 2k + 2)_{+}, except when k = 2 and H ∈ {3, 4}, which need exactly one bit.',
      'Randomization with fixed error below 1/2 does not improve the dense Θ(N log k) bound.',
      'All capacity profiles together have at most N breakpoint capacities and N(N + 1)/2 finite constant runs, and the quadratic order is sharp.',
    ],
    limits: ['The memory bounds are stated for arenas with N ≥ 8 vertices.'],
    abstract: [
      'We study alternating graph games with optional repetition claims, expiring budgets, and no reset on a directed cycle. A supplied history reduces to a fixed draw boundary in the current strongly connected component and a bit for a current claim. The clock game has positional policies on the arena that are optimal at every entering reserve.',
      'For N ≥ 8 vertices, capacity H, and repetition threshold k, put S = (H − 2k + 2)_{+}. Exact online value monitoring needs no history memory when H ≤ 2k − 2. Otherwise it requires Θ(min{N log k, log (N + S choose S)}) bits, except when k = 2 and H ∈ {3, 4}, which require exactly one bit. The upper bound discards counts that cannot reach the threshold before expiration; common continuations distinguish equal-length live histories for the lower bound. Randomization with fixed error below 1/2 does not improve the dense Θ(N log k) bound.',
      'For clock games with positive integer costs and arbitrary reset cycles, all capacity profiles together have at most N breakpoint capacities and N(N + 1)/2 finite constant runs. The quadratic order is sharp. At most N + 1 distance computations per player construct all profiles; without reset cycles, a second algorithm processes rank changes directly. The history results extend to infinite arenas with a well-founded potential for resets and arbitrary branching.',
    ],
    plate: 'repetition',
    figure:
      'A game arena of eight positions on a directed cycle, owners alternating, where a square may also step back. A token walks it against an expiring reserve and each visit is tallied; every live history is searched for a threefold repetition, and the paper’s memory bound is evaluated for the current capacity.',
  },
  {
    slug: 'logarithmic-sobolev-stability',
    short: 'Critical logarithmic Sobolev stability',
    record: 23484591,
    doi: '10.5281/zenodo.23484591',
    title: 'Critical logarithmic Sobolev stability: moment bounds and heat flow',
    field: 'mathematics',
    area: 'Analysis and probability',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Critical_Stability_Refined.pdf', bytes: 464293, pages: 19 }],
    summary:
      'Sharp bounds on the first variation of the Gaussian logarithmic Sobolev deficit, and how integrating it along heat flow restores dimension-free stability.',
    shows: [
      'At prescribed Fisher information and a second-moment cap, the infimum of the squared norm of the first variation of the deficit, and every case where it is attained.',
      'Its integral along the Ornstein-Uhlenbeck flow controls Wasserstein distance, Fisher information and the deficit with sharp constants, with no covariance or Poincaré assumption.',
      'Every centered isotropic Gaussian gives equality, and the flow estimates extend to closed weighted manifolds with positive weighted Ricci curvature.',
    ],
    limits: [
      'The instantaneous norm gives no dimension-free transport estimate.',
      'No fixed observation interval suffices, and the normalized escaping components need not be Gaussian.',
    ],
    abstract: [
      'We study the transport first variation of the Gaussian logarithmic Sobolev deficit. At prescribed Fisher information and a second-moment cap, we determine the infimum of its squared norm and all attainment cases. Remainder identities identify the Gaussian limit of every minimizing sequence and its lost second moment. We also characterize the directional moment defects of sequences with vanishing first variation; their normalized escaping components need not be Gaussian.',
      'Although the instantaneous norm gives no dimension-free transport estimate, its integral along the Ornstein-Uhlenbeck flow controls Wasserstein distance, Fisher information, and the deficit with sharp constants. These estimates require no covariance or Poincaré assumption, and every centered isotropic Gaussian gives equality. No fixed observation interval suffices. Finally, we identify the Wasserstein metric slope at regular densities and extend the flow estimates to closed weighted manifolds with positive weighted Ricci curvature.',
    ],
    plate: 'log-sobolev',
    figure:
      'A density with a small escaping bump carried by the Ornstein-Uhlenbeck flow toward the standard Gaussian. Earlier times are drawn in pencil, the Gaussian in ink, and the relative Fisher information is computed live along the flow and traced below on a log scale.',
  },
  {
    slug: 'constrained-permanents-galois-groups',
    short: 'Galois groups of constrained permanents',
    record: 23484570,
    doi: '10.5281/zenodo.23484570',
    title: 'Galois groups and real critical points of constrained permanents',
    field: 'mathematics',
    area: 'Real algebraic geometry',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Critical_Permanents.pdf', bytes: 385674, pages: 13 }],
    summary:
      'The 16 critical points of the 3 × 3 permanent under fixed row and column sums: Galois group S₁₆, and at least four real ones in every nondegenerate fiber.',
    shows: [
      'The critical algebra is free of rank sixteen over the marginal parameters, and both its arithmetic and geometric Galois groups are S_{16}.',
      'Over the reals the gradient has topological degree four, and an explicit family with positive marginals develops an interior local minimum and a saddle at a fold.',
      'For m constrained three-by-three matrices with quadratic interactions: critical length 16^{m}, and between 4^{m} and 16^{m} real points in every nondegenerate fiber, both bounds attained.',
    ],
    limits: [
      'The critical points studied are affine stationary points: they need not be nonnegative, and they do not include every boundary optimum of the transportation polytope.',
    ],
    abstract: [
      'We study the critical points of the three-by-three permanent under prescribed row and column sums. Their critical algebra is free of rank sixteen over the polynomial ring in the marginal parameters, and both its arithmetic and geometric Galois groups are S_{16}. The proof combines a Fourier normal form, a rational specialization, and a simple branch point at a positive matrix.',
      'Over the reals, the gradient has topological degree four. An explicit family with positive marginals develops an interior local minimum and a saddle at a fold; below the transition, every minimum on the transportation polytope lies on its boundary. Rational-univariate representations isolate all real and positive critical matrices, including at nonreduced fibers. For m constrained three-by-three matrices with quadratic interactions, the same argument gives critical length 16^{m} and between 4^{m} and 16^{m} real points in every nondegenerate fiber, with both bounds attained.',
    ],
    plate: 'permanents',
    figure:
      'Newton paths from random starting matrices inside the space of 3 × 3 matrices with fixed row and column sums, seen in one projection over the transportation polytope, converging to real critical points of the permanent. Each point is kept only once its gradient vanishes to twelve digits, and is marked by its Morse index.',
  },
  {
    slug: 'certified-compression-game-tables',
    record: 23484548,
    doi: '10.5281/zenodo.23484548',
    title: 'Certified compression of game-value tables',
    field: 'computer-science',
    area: 'Games and verification',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Certified_Compression.pdf', bytes: 290240, pages: 17 }],
    summary:
      'Certified answers to exact game-value queries from partial tables; on 26 pawnless chess classes, storage 61.64% below the published Syzygy inventory.',
    shows: [
      'A sound and complete endpoint certificate for any retained subset of a finite alternating game with irreversible budget resets, even when the omitted region contains cycles.',
      'For widths at most w, certification takes O((w + log(N + 2))(N + E)) graph operations, or O(w(N + E)) when the omitted region is acyclic.',
      'A chess implementation stores 26 complete pawnless classes in 7,585,632 bytes, 61.64% below their published Syzygy WDL/DTZ inventory, and every file passes endpoint certification.',
    ],
    limits: [
      'The seven-ply quiet-depth bound does not prevent near-threshold p99 latency of 133 milliseconds.',
      'The storage savings are not credited to the general checker or the grid optimizer, which were tested separately.',
    ],
    abstract: [
      'Exact game-value queries can be recovered from signed distance intervals stored on only part of an arena. We prove a sound and complete endpoint certificate for any retained subset of a finite alternating game with irreversible budget resets. The omitted region may contain cycles. Two extremal boundary problems recover its sharp componentwise bounds without increasing interval width. For widths at most w, certification takes O((w + log(N + 2))(N + E)) graph operations, or O(w(N + E)) when the omitted region is acyclic.',
      'Under periodic retention, we characterize the exact worst-case refinement depth and prove a matching checkpoint-density bound. Adjacent checkpoint pairs are asymptotically optimal for one-sided storage. A dynamic program also minimizes additive interval-coding cost subject to a prescribed depth bound.',
      'A chess implementation using the existing paired grids stores 26 complete pawnless classes in 7,585,632 bytes, 61.64% below their published Syzygy WDL/DTZ inventory. All files pass endpoint certification. The representation preserves all five outcome categories and exact fresh-clock values; its seven-ply quiet-depth bound does not prevent near-threshold p99 latency of 133 milliseconds. The general checker and grid optimizer are tested separately and are not credited with these storage savings.',
    ],
    plate: 'certified',
    figure:
      'A small game arena laid out as an 8 × 8 board: a token steps left, down or diagonally down-left. Distances are solved by retrograde analysis; checkpoints on a periodic pattern of diagonals keep only a coarse interval, every other square derives one from them, and the verifier certifies each interval at both endpoints as it scans.',
  },
  {
    slug: 'clique-minors-independence-two',
    short: 'Clique minors and fractional clique covers',
    record: 23484533,
    doi: '10.5281/zenodo.23484533',
    title: 'Clique minors and fractional clique covers in graphs with independence number two',
    field: 'mathematics',
    area: 'Graph theory',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Clique_Minors.pdf', bytes: 313647, pages: 11 }],
    summary:
      'For graphs with independence number two: clique-minor bounds turned into chromatic bounds without accumulated error, and what that gives for Hadwiger.',
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
    plate: 'clique',
    figure:
      'The complement of the Petersen graph, a graph with independence number two. All 120 vertex triples are checked for independence, then five connected branch sets are inked, pairwise adjacent, forming a K₅ minor.',
  },
  {
    slug: 'pattern-avoiding-ascent-sequences',
    short: 'Growth of pattern-avoiding ascent sequences',
    record: 23484513,
    doi: '10.5281/zenodo.23484513',
    title: 'Repetition graphs and the growth of pattern-avoiding sequences',
    field: 'mathematics',
    area: 'Enumerative combinatorics',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'ascent_seq.pdf', bytes: 423902, pages: 22 }],
    summary:
      'Ascent sequences avoiding patterns of the form 012⋯(d + u)d grow like n log n − 2n log log n + O(n), and their generating functions are not D-finite.',
    shows: [
      'For every fixed nonempty family of patterns 012⋯(d + u)d, each using at least three distinct values, log A(n) = n log n − 2n log log n + O(n).',
      'The ordinary and exponential generating functions are not D-finite, and the exponential one is entire of infinite order.',
      'Families containing a pattern with fewer than three values have explicit rational ordinary generating functions.',
    ],
    limits: ['The linear term of log A(n) is determined here for one family: 0120, 0121 and 0122 avoided together.'],
    abstract: [
      'We study ascent sequences avoiding patterns of the form 012⋯(d + u)d. For every fixed nonempty family of these patterns, each using at least three distinct values, the number A(n) of avoiding sequences satisfies log A(n) = n log n − 2n log log n + O(n). The proof associates a graph with consecutive occurrences of equal values. A bound on its chromatic number allows us to reconstruct a sequence from one occurrence of each value and a controlled amount of additional data. Permutation bounds give the upper estimate; appending distinct larger entries to suitable prefixes gives the lower estimate.',
      'The ordinary and exponential generating functions are not D-finite, and the latter is entire of infinite order. Families containing a pattern with fewer than three values instead have explicit rational ordinary generating functions. We also determine the coefficient of the linear term in log A(n) for simultaneous avoidance of 0120, 0121, and 0122. For weak ascent sequences and inversion sequences, we obtain the corresponding linear terms and concentration estimates for the number of repetitions.',
    ],
    plate: 'ascent',
    figure:
      'A random ascent sequence avoiding 0120, 0121 and 0122, plotted value against position, with arcs joining consecutive occurrences of equal values (the arcs of the paper’s repetition graph) and the ascent bound as a staircase. Every four-term subsequence is checked for the patterns.',
  },
  {
    slug: 'regression-coresets',
    short: 'Regression coresets: attainable fits and reuse',
    record: 23484487,
    doi: '10.5281/zenodo.23484487',
    title: 'Regression coresets: attainable fits, conditioning, and reuse',
    field: 'machine-learning',
    area: 'Learning theory',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Regression_Coresets.pdf', bytes: 363050, pages: 26 }],
    summary:
      'What a fixed weighted subset of data preserves in least squares: the fits it can reach, their conditioning, and when it holds along the ridge path.',
    shows: [
      'For a prescribed support, the closure of its weighted least-squares solutions is the union of the bounded faces of a hyperplane arrangement; on d + 1 rows it is the convex hull of the d-row interpolants.',
      'New upper bounds for the scalar minimax risk, including 8/5 ≤ R_{5}(7) ≤ 5/3.',
      'A weighted subset preserves the entire ridge path exactly when it matches the response cross moment and the action of the covariance on a Krylov subspace.',
    ],
    limits: [
      'Reweighting improved every initial condition number in 16 configurations from three tabular sources, by a median factor of 6.46, but usually increased sensitivity to new labels.',
    ],
    abstract: [
      'Weighted regression coresets may reproduce one least-squares solution while remaining poorly conditioned or failing when the regularization parameter or response changes. We characterize what a fixed weighted subset can preserve in each setting. For a prescribed support, the closure of its weighted least-squares solutions is the union of the bounded faces of a hyperplane arrangement. On supports of size d + 1, this set is the convex hull of the d-row interpolants, which permits rational certificates for the optimal fit. A recursive construction also gives new upper bounds for the scalar minimax risk, including 8/5 ≤ R_{5}(7) ≤ 5/3.',
      'For exact coresets, we formulate convex reweighting problems that improve conditioning on a fixed support or bound covariance inflation during construction. Finally, a weighted subset preserves the entire ridge path exactly when it matches the response cross moment and the action of the covariance on a Krylov subspace. Experiments on 16 configurations from three tabular data sources improved every initial condition number, by a median factor of 6.46, but usually increased sensitivity to new labels.',
    ],
    plate: 'coresets',
    figure:
      'Coefficient space for a regression with two features and three rows. Each row is a line; the triangle between their pairwise intersections is the hull of the two-row interpolants. Random positive weightings are solved live, and every weighted fit lands inside the triangle.',
  },
  {
    slug: 'elliptic-solvers-locality',
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
      'How much global information a local approximation to an elliptic inverse needs: order n^{d}/(w + 1)^{d} shared coordinates, attained by a linear construction.',
    shows: [
      'For the Dirichlet Laplacian on an n^{d} grid, uniform relative energy error at any fixed tolerance below one requires order n^{d}/(w + 1)^{d} shared coordinates, where w is the local radius, and a linear construction attains this order.',
      'For a prescribed linear measurement map, an explicit pair of inputs that the solver cannot distinguish.',
    ],
    limits: [
      'A learned model with 16 sine moments errs by 67.0% on white forcings, against 6.1% on smooth ones.',
      'No tested learned initial guess cut median end-to-end solve time on the largest timed grid.',
    ],
    abstract: [
      'We study how much global information a local approximation to an elliptic inverse needs. At each grid point, the solver receives nearby right-hand-side values and a continuous encoding of the full input; both the encoder and reconstruction may be nonlinear. For the Dirichlet Laplacian on an n^{d} grid, uniform relative energy error at any fixed tolerance below one requires order n^{d}/(w + 1)^{d} shared coordinates, where w is the local radius. A linear construction attains this order. We give finite bounds, leading constants as the tolerance approaches one, and a tradeoff between cumulative local propagation and the total dimension of global messages.',
      'The lower bound combines a Borsuk-Ulam argument with canonical correlations of the Green matrix. For a prescribed linear measurement map, it also gives an explicit pair of inputs that the solver cannot distinguish. Experiments on the two-dimensional Poisson problem compare local convolutional, moment-based, Fourier, and multiscale models. A model using 16 sine moments has mean energy error 6.1% on smooth forcings and 67.0% on white forcings at the training resolution. Broader training reduces some of this gap, whereas none of the tested learned initial guesses reduces median end-to-end solve time at the largest timed grid.',
    ],
    plate: 'elliptic',
    figure:
      'A 24 × 24 grid with a point and its local window of radius three. Contours of the discrete Green’s function show how the solution there depends on the whole input; the share of that dependence outside the window is computed live as the point moves (away from the four corner points, where it dips just below half).',
  },
  {
    slug: 'gibbs-relative-covariance',
    short: 'Relative covariance in discrete Gibbs models',
    record: 23484418,
    doi: '10.5281/zenodo.23484418',
    title: 'Relative covariance approximation in discrete Gibbs models',
    field: 'machine-learning',
    area: 'Probabilistic models',
    published: '2026-10-19',
    files: [{ label: 'Paper', name: 'Relative_Covariance_Approximation.pdf', bytes: 397412, pages: 12 }],
    summary:
      'When a covariance approximation for a discrete Gibbs model stays accurate in relative terms, including in its directions of smallest variance.',
    shows: [
      'For a fixed finite Gibbs model, the asymptotic covariance scales come from the affine spans of energy sublevel sets, and the final span-increasing energy sets the sampling threshold for relative covariance recovery.',
      'For distributions on matroid bases, single-element exchanges give a Laplacian comparison, and bases within a fixed exchange distance give a finite-temperature bound.',
      'For hard-core models, a cluster expansion yields an error bound controlled by local activity.',
    ],
    limits: [
      'In the small conditional subset-prediction problem, exact Newton is faster.',
      'No general training-speed improvement is claimed: the results are about relative covariance control.',
    ],
    abstract: [
      'A covariance approximation can have small absolute error while badly distorting a direction of small variance. For a fixed finite Gibbs model, we identify the asymptotic covariance scales from the affine spans of energy sublevel sets and show that the final span-increasing energy determines the sampling threshold for relative covariance recovery. For distributions on matroid bases, single-element exchanges give a Laplacian comparison, and conditioning on bases within a fixed exchange distance gives a finite-temperature bound. For hard-core models, a cluster expansion yields an error bound controlled by local activity.',
      'Experiments confirm the sampling threshold, retain accuracy of the second-order hard-core approximation on growing strips at low activity, and compare exchange truncations in a small conditional subset-prediction problem. In the last setting, exact Newton is faster. The results concern relative covariance control and do not imply a general training-speed improvement.',
    ],
    plate: 'gibbs',
    figure:
      'A hard-core lattice gas on a 5 × 26 strip at activity 0.6: sites in pencil, occupied sites in ink. A Glauber chain runs live and checks every bond after every step for two occupied neighbors: none appear. Below, its density settles onto the exact value from the transfer matrix.',
  },
  {
    slug: 'mixed-precision-calibration-limits',
    record: 23484231,
    doi: '10.5281/zenodo.23484231',
    title: 'Calibration limits in mixed-precision quantization',
    field: 'machine-learning',
    area: 'Model compression',
    published: '2026-10-19',
    files: [
      { label: 'Paper', name: 'Calibration limits.pdf', bytes: 303754, pages: 10 },
      { label: 'Supplement', name: 'supplement.pdf', bytes: 316227, pages: 10 },
    ],
    summary:
      'Which calibration measurements actually improve mixed-precision bit allocation, measured by exhaustive evaluation of 25 small trained networks.',
    shows: [
      'Exhaustive evaluation of 25 small trained networks separates approximation bias, sampling variance, and omissions from a shortlist.',
      'With round-to-nearest quantization, output scoring reduces normalized allocation regret by 61.0% relative to additive scalar scoring.',
      'Cross-tensor Fisher terms can help under rounding yet increase sampling error after reconstruction.',
    ],
    limits: [
      'After a GPTQ Cholesky update the reduction is 6.7%, and its interval includes zero.',
      'Lower teacher discrepancy need not translate into a general accuracy or speed advantage.',
      'The findings are limited to the small networks and quantizers in the study.',
    ],
    abstract: [
      'Mixed-precision allocation is constrained by the information retained from calibration evaluations. We compare scalar loss profiles, reconstructed output vectors, and direct comparisons under matched forward budgets. Exhaustive evaluation of 25 small trained networks separates approximation bias, sampling variance, and omissions from a shortlist. With round-to-nearest quantization, output scoring reduces normalized allocation regret by 61.0% relative to additive scalar scoring. After a GPTQ Cholesky update, the reduction is 6.7%, and its interval includes zero.',
      'Fisher controls show that cross-tensor terms can help under rounding yet increase sampling error after reconstruction. Native task metrics, a corrupted-input experiment, and a residual-depth series likewise show that lower teacher discrepancy need not translate into a general accuracy or speed advantage. The accompanying constructions characterize limits of the restricted observation models. These results concern the small networks and quantizers studied here.',
    ],
    plate: 'calibration',
    figure:
      'Bit-width allocations for a six-tensor toy network: all 4,096 assignments of 2, 3, 4 or 8 bits plotted by storage and error against a storage budget, feasible ones in pencil, the frontier and the lowest-error allocation within the budget in ink, as the budget sweeps.',
  },
];

export const fieldCount = (f: Field) => papers.filter((p) => p.field === f).length;
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
