export default {
  id: 'cracking-the-safe',
  title: 'Cracking the Safe',
  difficulty: 'Hard',
  order: 6,
  pattern: 'adv-graph-euler-hierholzer',
  tags: ['graph', 'eulerian circuit', 'de bruijn sequence', 'dfs'],
  source: { platform: 'LeetCode', number: 753, url: 'https://leetcode.com/problems/cracking-the-safe/' },

  statement: `A safe has an \`n\`-digit password; each digit is in \`0 … k-1\`. The safe keeps only the **last \`n\` digits typed** and opens as soon as they match the password.

Return **any** string of minimum length that is guaranteed to open the safe — i.e. every one of the \`k^n\` possible passwords appears in it as a contiguous substring.`,
  examples: [
    { input: 'n = 1, k = 2', output: '"10"', explanation: '"01" is also correct.' },
    { input: 'n = 2, k = 2', output: '"01100"', explanation: 'Contains 01, 11, 10, 00. "00110", "10011" … are also correct.' },
  ],
  constraints: ['1 <= n <= 4', '1 <= k <= 10', '1 <= k^n <= 4096'],

  think: `- Every character after the first n − 1 "completes" one password. What is the best possible length, then?
- Think of the last n − 1 typed digits as your current **state**. Typing digit d moves you to a new state. What does each such move correspond to?
- Using every move exactly once — which classic graph walk is that?`,
  patternChallenge: {
    options: ['Backtracking over all strings of increasing length', 'Eulerian circuit on a de Bruijn graph (Hierholzer)', 'BFS over passwords', 'Greedy: always append the largest digit'],
    answer: 1,
    explanation: 'Nodes = (n−1)-digit states, edges = n-digit passwords. Every node has k in- and k out-edges, so an Euler circuit exists and visits every password once → length k^n + n − 1. Backtracking works but has no guarantee; BFS finds shortest paths, not covering walks; pure greedy can get stuck.',
  },
  hints: [
    'Minimum length is k^n + n − 1: the first n − 1 characters complete nothing, and each later character completes exactly one password.',
    'Hierholzer: from state s try digits d; if password s + d is unused, mark it, recurse on (s + d).slice(1), then append d (post-order). Answer = start state + collected digits.',
  ],
  approach: `**Lower bound:** k^n passwords, each must end at a distinct position ≥ n − 1 → length ≥ k^n + n − 1.

**De Bruijn graph:**
- Node: any string of length n − 1 (k^(n−1) nodes).
- Edge: from \`s\` via digit \`d\` to \`(s + d).slice(1)\`; the edge "is" password \`s + d\`.
- In-degree = out-degree = k for every node, and the graph is strongly connected → an **Euler circuit** exists.

**Hierholzer (post-order):** start at \`"0".repeat(n − 1)\`; DFS over unused edges; push the digit *after* the recursive call returns. The digits come out in reverse circuit order; writing them followed by the start state is the standard way to read that circuit as a string, and every password still appears exactly once (the checker verifies it).

Many strings are correct, so the tests use a checker: correct length and all k^n passwords present.`,

  functionName: 'crackSafe',
  paramNames: ['n', 'k'],
  starterCode: `/**
 * @param {number} n
 * @param {number} k
 * @return {string}
 */
function crackSafe(n, k) {
  
}
`,
  checker: `(output, args) => {
  const [n, k] = args;
  const total = Math.pow(k, n);
  if (typeof output !== 'string' || output.length !== total + n - 1) return false;
  for (const ch of output) {
    const d = ch.charCodeAt(0) - 48;
    if (d < 0 || d >= k) return false;
  }
  const seen = new Set();
  for (let i = 0; i + n <= output.length; i++) seen.add(output.slice(i, i + n));
  return seen.size === total;
}`,
  tests: [
    { scenario: 'Example 1', hint: 'n = 1: the state is the empty string; the answer is just every digit once.', args: [1, 2], expected: '10' },
    { scenario: 'Example 2', hint: 'Length must be k^n + n − 1 = 5, containing 00, 01, 10, 11.', args: [2, 2], expected: '01100' },
    { scenario: 'Single digit, k = 1', hint: 'Only password "0": the answer is "0".', args: [1, 1], expected: '0' },
    { scenario: 'Two digits, k = 1', hint: 'Only password "00": length k^n + n − 1 = 2. Forgetting the n − 1 start characters gives "0".', args: [2, 1], expected: '00' },
    { scenario: 'n = 3, k = 2', hint: 'Eight passwords in a 10-character string: each new character completes exactly one new password.', args: [3, 2], expected: '0011101000' },
    { scenario: 'n = 2, k = 3', hint: 'Nine passwords, length 10. Appending digits pre-order instead of post-order can miss some.', args: [2, 3], expected: '0221120100' },
    { scenario: 'n = 4, k = 2', hint: '16 binary passwords in 19 characters (a de Bruijn sequence).', args: [4, 2], expected: '0001111010110010000' },
    { scenario: 'n = 3, k = 3', hint: '27 passwords, length 29.', args: [3, 3], expected: '00222121112201202101102001000' },
    { scenario: 'n = 1, k = 10', hint: 'Every digit 0–9 once, in any order.', args: [1, 10], expected: '9876543210' },
    { scenario: 'n = 2, k = 10', hint: '100 two-digit passwords in 101 characters.', args: [2, 10], expected: '09988978779686766958575655948474645449383736353433928272625242322918171615141312119080706050403020100' },
    { scenario: 'n = 4, k = 4', hint: '256 passwords, length 259: an Eulerian circuit over 64 states.', args: [4, 4], expected: '0003333232332232222333123313231223131332123213221222131212133112311321122113111211113330233013303230223012303130213011303033202320132032202220122031202120112030202033102310131032102210121031102110111030102010103300230013003200220012003100210011003000200010000' },
    { scenario: 'n = 3, k = 10', hint: '1000 passwords in 1002 characters; every password must appear exactly once.', args: [3, 10], expected: '009998988899789798788797787779968967969868867869768767769668667666995895795695985885785685975875775675965865765665955855755655599489479469459498488478468458497487477467457496486476466456495485475465455494484474464454449938937936935934939838837836835834839738737736735734739638637636635634639538537536535534539438437436435434439338337336335334333992892792692592492392982882782682582482382972872772672572472372962862762662562462362952852752652552452352942842742642542442342932832732632532432332922822722622522422322299189179169159149139129198188178168158148138128197187177167157147137127196186176166156146136126195185175165155145135125194184174164154144134124193183173163153143133123192182172162152142132122191181171161151141131121119908907906905904903902901909808807806805804803802801809708707706705704703702701709608607606605604603602601609508507506505504503502501509408407406405404403402401409308307306305304303302301309208207206205204203202201209108107106105104103102101109008007006005004003002001000' },
    { scenario: 'Max k^n = 4096 (n = 4, k = 8)', hint: 'The largest allowed input: 4096 passwords, 4099 characters. Every edge of the de Bruijn graph must be used exactly once.', args: [4, 8], expected: '0007777676776676666777567757675667575776567657665666575656577556755765566557555655557774677457747674667456747574657455747477646764576476646664566475646564556474646477546754575476546654565475546554555474546454547744674457447644664456447544654455447444644454444777367735773477376736673567346737573657355734573747364735473447373776367635763476376636663566346637563656355634563746364635463446373636377536753575347537653665356534653755365535553455374536453545344537353635353774367435743474376436643564346437543654355434543744364435443444373436343534343773367335733473376336633563346337533653355334533743364335433443373336333533343333777267725772477237727672667256724672367275726572557245723572747264725472447234727372637253724372337272776267625762476237627662666256624662366275626562556245623562746264625462446234627362636253624362336272626277526752575247523752765266525652465236527552655255524552355274526452545244523452735263525352435233527252625252774267425742474237427642664256424642364275426542554245423542744264425442444234427342634253424342334272426242524242773267325732473237327632663256324632363275326532553245323532743264325432443234327332633253324332333272326232523242323277226722572247223722762266225622462236227522652255224522352274226422542244223422732263225322432233227222622252224222322227771677157714771377127717671667156714671367126717571657155714571357125717471647154714471347124717371637153714371337123717271627152714271327122717177616761576147613761276176616661566146613661266175616561556145613561256174616461546144613461246173616361536143613361236172616261526142613261226171616177516751575147513751275176516651565146513651265175516551555145513551255174516451545144513451245173516351535143513351235172516251525142513251225171516151517741674157414741374127417641664156414641364126417541654155414541354125417441644154414441344124417341634153414341334123417241624152414241324122417141614151414177316731573147313731273176316631563146313631263175316531553145313531253174316431543144313431243173316331533143313331233172316231523142313231223171316131513141313177216721572147213721272176216621562146213621262175216521552145213521252174216421542144213421242173216321532143213321232172216221522142213221222171216121512141213121217711671157114711371127117611661156114611361126117511651155114511351125117411641154114411341124117311631153114311331123117211621152114211321122117111611151114111311121111777067705770477037702770177076706670567046703670267016707570657055704570357025701570747064705470447034702470147073706370537043703370237013707270627052704270327022701270717061705170417031702170117070776067605760476037602760176076606660566046603660266016607560656055604560356025601560746064605460446034602460146073606360536043603360236013607260626052604260326022601260716061605160416031602160116070606077506750575047503750275017507650665056504650365026501650755065505550455035502550155074506450545044503450245014507350635053504350335023501350725062505250425032502250125071506150515041503150215011507050605050774067405740474037402740174076406640564046403640264016407540654055404540354025401540744064405440444034402440144073406340534043403340234013407240624052404240324022401240714061405140414031402140114070406040504040773067305730473037302730173076306630563046303630263016307530653055304530353025301530743064305430443034302430143073306330533043303330233013307230623052304230323022301230713061305130413031302130113070306030503040303077206720572047203720272017207620662056204620362026201620752065205520452035202520152074206420542044203420242014207320632053204320332023201320722062205220422032202220122071206120512041203120212011207020602050204020302020771067105710471037102710171076106610561046103610261016107510651055104510351025101510741064105410441034102410141073106310531043103310231013107210621052104210321022101210711061105110411031102110111070106010501040103010201010770067005700470037002700170076006600560046003600260016007500650055004500350025001500740064005400440034002400140073006300530043003300230013007200620052004200320022001200710061005100410031002100110070006000500040003000200010000' },
    { scenario: 'n = 2, k = 7', hint: 'Mid-size alphabet: 49 passwords in 50 characters.', args: [2, 7], expected: '06655645446353433625242322615141312116050403020100' },
  ],

  solution: {
    code: `function crackSafe(n, k) {
  const start = '0'.repeat(n - 1);
  const used = new Set();          // passwords (edges) already used
  const digits = [];

  function visit(state) {
    for (let d = 0; d < k; d++) {
      const password = state + d;
      if (used.has(password)) continue;
      used.add(password);
      visit(password.slice(1));    // next state = last n − 1 digits
      digits.push(d);              // post-order: record the edge after its subtree
    }
  }
  visit(start);
  return digits.join('') + start;
}`,
    explanation: 'Recursion depth is at most k^n ≤ 4096 here, which is safe. For n = 1 the state is the empty string and every digit is its own password.',
  },
  dryRun: {
    columns: ['call', 'try', 'action', 'digits'],
    rows: [
      ['visit("0")', 'd=0 → "00"', 'new → visit("0")', ''],
      ['  visit("0")', 'd=0 "00" used; d=1 → "01"', 'new → visit("1")', ''],
      ['    visit("1")', 'd=0 → "10"', 'new → visit("0") (no edges left) → push 0', '0'],
      ['    visit("1")', 'd=1 → "11"', 'new → visit("1") (none left) → push 1', '0 1'],
      ['  back in visit("0")', 'after "01"', 'push 1', '0 1 1'],
      ['visit("0")', 'after "00"', 'push 0; d=1 "01" used', '0 1 1 0'],
      ['result', '"0110" + "0"', '"01100"', ''],
    ],
  },
  complexity: { time: 'O(n · k^n)', space: 'O(n · k^n)', explanation: 'k^n edges, each handled once; building/slicing the n-character password string costs O(n). The Set stores k^n strings of length n.' },
  alternative: {
    title: 'Greedy "prefer largest digit" (Martin-style)',
    md: 'Start with n − 1 zeros; repeatedly append the largest digit d such that the last n characters form a password not seen before. For de Bruijn graphs this greedy provably never gets stuck early and yields an optimal sequence. Shorter to write, harder to justify in an interview.',
    code: `function crackSafe(n, k) {
  let s = '0'.repeat(n - 1);
  const seen = new Set();
  const total = Math.pow(k, n);
  while (seen.size < total) {
    const tail = s.slice(s.length - (n - 1));
    for (let d = k - 1; d >= 0; d--) {
      const p = tail + d;
      if (!seen.has(p)) { seen.add(p); s += d; break; }
    }
  }
  return s;
}`,
    complexity: 'O(n · k^(n+1)) time',
  },
  mistakes: [
    'Treating passwords as nodes (then you need a Hamiltonian path — much harder).',
    'Appending digits before the recursive call (pre-order) — can produce a string that misses passwords.',
    'Forgetting the n − 1 start characters, giving length k^n instead of k^n + n − 1.',
    'n = 1: the state is "" — make sure your slice logic handles it.',
  ],
};
