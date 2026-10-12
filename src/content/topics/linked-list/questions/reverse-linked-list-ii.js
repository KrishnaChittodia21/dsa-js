export default {
  id: 'reverse-linked-list-ii',
  title: 'Reverse Linked List II',
  difficulty: 'Medium',
  order: 8,
  pattern: 'linked-list-in-place-reversal',
  tags: ['linked list'],
  source: { platform: 'LeetCode', number: 92, url: 'https://leetcode.com/problems/reverse-linked-list-ii/' },

  statement: `Given the \`head\` of a singly linked list and two **1-indexed** positions \`left <= right\`, reverse only the nodes from position \`left\` to position \`right\` and return the head of the list.

Follow-up: do it in one pass.`,
  examples: [
    { input: 'head = [1,2,3,4,5], left = 2, right = 4', output: '[1,4,3,2,5]' },
    { input: 'head = [5], left = 1, right = 1', output: '[5]' },
  ],
  constraints: ['1 <= n <= 500', '-500 <= Node.val <= 500', '1 <= left <= right <= n'],

  think: `- Which node must you hold to reconnect the front part to the reversed segment?
- What if \`left = 1\` — the head changes. How do you avoid a special case?
- Can you reverse the segment while keeping both ends connected the whole time?`,
  patternChallenge: {
    options: ['Fast & Slow Pointers', 'In-place reversal of a segment (dummy + head insertion)', 'Merge two lists', 'Stack of all nodes'],
    answer: 1,
    explanation: 'It is a reversal restricted to a range. A dummy handles left = 1; head insertion reverses the segment in one pass with O(1) space. A stack works but is O(n) space.',
  },
  hints: [
    'Walk `prev` from a dummy `left − 1` steps: it is the node just before the segment. Let `cur = prev.next`.',
    'Repeat `right − left` times: move the node after `cur` to directly after `prev`.',
  ],
  approach: `**Brute force:** copy values to an array, reverse the slice \`[left−1, right−1]\`, write values back. O(n) space.

**One pass, O(1) space (head insertion):**
1. \`dummy.next = head\`; walk \`prev\` to position \`left − 1\`.
2. \`cur = prev.next\` — the first node of the segment; it will end up as the segment's last node and never moves relative to \`prev\`'s logic.
3. \`right − left\` times: \`move = cur.next; cur.next = move.next; move.next = prev.next; prev.next = move\`.
4. Return \`dummy.next\`.

Each step keeps the list fully connected, so there is no separate "reconnect" step.`,

  functionName: 'reverseBetween',
  paramNames: ['head', 'left', 'right'],
  io: { params: ['list', 'any', 'any'], returns: 'list' },
  starterCode: `/**
 * @param {ListNode} head
 * @param {number} left
 * @param {number} right
 * @return {ListNode}
 */
function reverseBetween(head, left, right) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Reverse positions 2..4 (1-indexed).',
      args: [[1, 2, 3, 4, 5], 2, 4], expected: [1, 4, 3, 2, 5] },
    { scenario: 'Example 2', hint: 'A single node with left = right = 1.',
      args: [[5], 1, 1], expected: [5] },
    { scenario: 'Reverse the whole list', hint: 'left = 1 and right = n — the head changes, so you need a dummy node.',
      args: [[1, 2, 3, 4, 5], 1, 5], expected: [5, 4, 3, 2, 1] },
    { scenario: 'Range starts at head', hint: 'left = 1: without a dummy there is no node before the range.',
      args: [[1, 2, 3, 4, 5], 1, 2], expected: [2, 1, 3, 4, 5] },
    { scenario: 'Range ends at tail', hint: 'right = n: the reversed block\'s tail must point to null.',
      args: [[1, 2, 3, 4, 5], 4, 5], expected: [1, 2, 3, 5, 4] },
    { scenario: 'Two nodes swapped', hint: 'Smallest list where reversal changes something.',
      args: [[3, 5], 1, 2], expected: [5, 3] },
    { scenario: 'left equals right', hint: 'Reversing one node changes nothing.',
      args: [[1, 2, 3], 2, 2], expected: [1, 2, 3] },
    { scenario: 'Negative values', hint: 'Positions are 1-indexed: prev moves left − 1 times from the dummy.',
      args: [[-1, 0, 1, 2, 3, 4], 2, 5], expected: [-1, 3, 2, 1, 0, 4] },
    { scenario: 'Off-by-one check', hint: 'Only positions 3..4 swap — moving prev one step too far or too short shifts the block.',
      args: [[10, 20, 30, 40, 50, 60], 3, 4], expected: [10, 20, 40, 30, 50, 60] },
    { scenario: 'Duplicate values', hint: 'Equal values hide mistakes — positions must still be exact.',
      args: [[1, 1, 2, 2, 1, 1], 2, 5], expected: [1, 1, 2, 2, 1, 1] },
    { scenario: 'Maximum length, middle range', hint: '500 nodes, reverse positions 100..400. In head insertion `cur` stays the same node — don\'t advance it.',
      argsGen: '() => [Array.from({ length: 500 }, (_, i) => i - 250), 100, 400]', expected: [-250,-249,-248,-247,-246,-245,-244,-243,-242,-241,-240,-239,-238,-237,-236,-235,-234,-233,-232,-231,-230,-229,-228,-227,-226,-225,-224,-223,-222,-221,-220,-219,-218,-217,-216,-215,-214,-213,-212,-211,-210,-209,-208,-207,-206,-205,-204,-203,-202,-201,-200,-199,-198,-197,-196,-195,-194,-193,-192,-191,-190,-189,-188,-187,-186,-185,-184,-183,-182,-181,-180,-179,-178,-177,-176,-175,-174,-173,-172,-171,-170,-169,-168,-167,-166,-165,-164,-163,-162,-161,-160,-159,-158,-157,-156,-155,-154,-153,-152,149,148,147,146,145,144,143,142,141,140,139,138,137,136,135,134,133,132,131,130,129,128,127,126,125,124,123,122,121,120,119,118,117,116,115,114,113,112,111,110,109,108,107,106,105,104,103,102,101,100,99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60,59,58,57,56,55,54,53,52,51,50,49,48,47,46,45,44,43,42,41,40,39,38,37,36,35,34,33,32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14,-15,-16,-17,-18,-19,-20,-21,-22,-23,-24,-25,-26,-27,-28,-29,-30,-31,-32,-33,-34,-35,-36,-37,-38,-39,-40,-41,-42,-43,-44,-45,-46,-47,-48,-49,-50,-51,-52,-53,-54,-55,-56,-57,-58,-59,-60,-61,-62,-63,-64,-65,-66,-67,-68,-69,-70,-71,-72,-73,-74,-75,-76,-77,-78,-79,-80,-81,-82,-83,-84,-85,-86,-87,-88,-89,-90,-91,-92,-93,-94,-95,-96,-97,-98,-99,-100,-101,-102,-103,-104,-105,-106,-107,-108,-109,-110,-111,-112,-113,-114,-115,-116,-117,-118,-119,-120,-121,-122,-123,-124,-125,-126,-127,-128,-129,-130,-131,-132,-133,-134,-135,-136,-137,-138,-139,-140,-141,-142,-143,-144,-145,-146,-147,-148,-149,-150,-151,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249] },
    { scenario: 'Maximum length, whole list', hint: '500 nodes reversed end to end.',
      argsGen: '() => [Array.from({ length: 500 }, (_, i) => 500 - 2 * i), 1, 500]', expected: [-498,-496,-494,-492,-490,-488,-486,-484,-482,-480,-478,-476,-474,-472,-470,-468,-466,-464,-462,-460,-458,-456,-454,-452,-450,-448,-446,-444,-442,-440,-438,-436,-434,-432,-430,-428,-426,-424,-422,-420,-418,-416,-414,-412,-410,-408,-406,-404,-402,-400,-398,-396,-394,-392,-390,-388,-386,-384,-382,-380,-378,-376,-374,-372,-370,-368,-366,-364,-362,-360,-358,-356,-354,-352,-350,-348,-346,-344,-342,-340,-338,-336,-334,-332,-330,-328,-326,-324,-322,-320,-318,-316,-314,-312,-310,-308,-306,-304,-302,-300,-298,-296,-294,-292,-290,-288,-286,-284,-282,-280,-278,-276,-274,-272,-270,-268,-266,-264,-262,-260,-258,-256,-254,-252,-250,-248,-246,-244,-242,-240,-238,-236,-234,-232,-230,-228,-226,-224,-222,-220,-218,-216,-214,-212,-210,-208,-206,-204,-202,-200,-198,-196,-194,-192,-190,-188,-186,-184,-182,-180,-178,-176,-174,-172,-170,-168,-166,-164,-162,-160,-158,-156,-154,-152,-150,-148,-146,-144,-142,-140,-138,-136,-134,-132,-130,-128,-126,-124,-122,-120,-118,-116,-114,-112,-110,-108,-106,-104,-102,-100,-98,-96,-94,-92,-90,-88,-86,-84,-82,-80,-78,-76,-74,-72,-70,-68,-66,-64,-62,-60,-58,-56,-54,-52,-50,-48,-46,-44,-42,-40,-38,-36,-34,-32,-30,-28,-26,-24,-22,-20,-18,-16,-14,-12,-10,-8,-6,-4,-2,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,134,136,138,140,142,144,146,148,150,152,154,156,158,160,162,164,166,168,170,172,174,176,178,180,182,184,186,188,190,192,194,196,198,200,202,204,206,208,210,212,214,216,218,220,222,224,226,228,230,232,234,236,238,240,242,244,246,248,250,252,254,256,258,260,262,264,266,268,270,272,274,276,278,280,282,284,286,288,290,292,294,296,298,300,302,304,306,308,310,312,314,316,318,320,322,324,326,328,330,332,334,336,338,340,342,344,346,348,350,352,354,356,358,360,362,364,366,368,370,372,374,376,378,380,382,384,386,388,390,392,394,396,398,400,402,404,406,408,410,412,414,416,418,420,422,424,426,428,430,432,434,436,438,440,442,444,446,448,450,452,454,456,458,460,462,464,466,468,470,472,474,476,478,480,482,484,486,488,490,492,494,496,498,500] },
  ],

  solution: {
    code: `function reverseBetween(head, left, right) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  for (let i = 1; i < left; i++) prev = prev.next; // node before the segment

  const cur = prev.next;                 // first node of the segment
  for (let i = 0; i < right - left; i++) {
    const move = cur.next;               // node to bring to the front
    cur.next = move.next;
    move.next = prev.next;
    prev.next = move;
  }
  return dummy.next;
}`,
  },
  dryRun: {
    columns: ['iteration', 'move', 'list'],
    rows: [
      ['start', '—', '1 → 2 → 3 → 4 → 5 (prev=1, cur=2)'],
      ['1', '3', '1 → 3 → 2 → 4 → 5'],
      ['2', '4', '1 → 4 → 3 → 2 → 5'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Walk to `left`, then right − left constant-time moves.' },
  alternative: {
    title: 'Cut, reverse, reconnect',
    md: 'Find the node before the segment and the segment tail, reverse the segment with the classic prev/cur/next loop for (right − left + 1) steps, then connect `before.next = newSegmentHead` and `oldSegmentHead.next = after`.',
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Not using a dummy → crashes or wrong head when left = 1.',
    'Off-by-one: positions are 1-indexed, so `prev` moves `left − 1` times from the dummy.',
    'Moving `cur` inside the loop — in head insertion `cur` stays the same node.',
  ],
};
