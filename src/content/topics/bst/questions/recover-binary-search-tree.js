export default {
  id: 'recover-binary-search-tree',
  title: 'Recover Binary Search Tree',
  difficulty: 'Medium',
  order: 8,
  pattern: 'bst-inorder-sorted',
  tags: ['tree', 'binary search tree', 'inorder'],
  source: { platform: 'LeetCode', number: 99, url: 'https://leetcode.com/problems/recover-binary-search-tree/' },

  statement: `The values of **exactly two** nodes of a binary search tree were swapped by mistake. Fix the tree **in place** by swapping those two values back, without changing the tree's structure. The function returns nothing; the tests inspect the tree after your call.`,
  examples: [
    { input: 'root = [1,3,null,null,2]', output: '[3,1,null,null,2]', explanation: '1 and 3 were swapped (3 cannot be the left child of 1).' },
    { input: 'root = [3,1,4,null,null,2]', output: '[2,1,4,null,null,3]', explanation: '2 and 3 were swapped.' },
  ],
  constraints: ['2 <= number of nodes <= 1000', '-2^31 <= Node.val <= 2^31 - 1', 'Exactly two values are out of place'],

  think: `- If you wrote the in-order values down, what would a correct BST look like? What does swapping two values do to that list?
- How many "drops" (places where \`prev > cur\`) can the list have? One? Two? When?
- Which value of each drop is the misplaced one?`,
  patternChallenge: {
    options: ['BST — Pass Valid Range Down', 'BST — In-order Traversal = Sorted Order', 'Sort all nodes by value and reassign', 'BST — Guided Descent'],
    answer: 1,
    explanation: 'In-order of a BST is sorted; two swapped values create one or two descents in that sequence, which pinpoint them. Bounds would detect that the tree is invalid but not which pair to swap; sorting and reassigning is O(n log n) and needs O(n) memory.',
  },
  hints: [
    'Do an in-order traversal keeping `prev`. Every time `prev.val > node.val`, you found a drop.',
    'At the first drop remember `first = prev`. At every drop set `second = node`. At the end swap `first.val` and `second.val`.',
  ],
  approach: `**Brute force:** in-order into an array of nodes, copy and sort the values, write them back in order — O(n log n) time, O(n) space.

**Optimized:** swapping x < y in a sorted list puts y too early and x too late:
- \`1 2 [6] 4 5 [3] 7\` → drops at \`6 > 4\` and \`5 > 3\`.
- adjacent swap \`1 [3 2] 4\` → a single drop \`3 > 2\`.

So walk in-order with \`prev\`; at the **first** drop set \`first = prev\`; at **every** drop set \`second = cur\`. Swap their values. O(n) time, O(h) stack.

**Follow-up — O(1) space:** Morris traversal performs the same in-order walk by temporarily threading each predecessor's right pointer back to the current node.`,

  functionName: 'recoverTree',
  paramNames: ['root'],
  starterCode: `/**
 * Do not return anything; modify root in place.
 * @param {TreeNode} root
 * @return {void}
 */
function recoverTree(root) {
  
}
`,
  io: { params: ['tree'], mutates: 0 },
  tests: [
    { scenario: 'Example 1', hint: '1 and 3 are swapped: 3 appears before 1 in the in-order sequence.', args: [[1, 3, null, null, 2]], expected: [3, 1, null, null, 2] },
    { scenario: 'Example 2', hint: '2 and 3 are swapped across the root.', args: [[3, 1, 4, null, null, 2]], expected: [2, 1, 4, null, null, 3] },
    { scenario: 'Two nodes swapped', hint: 'Smallest tree: the only two values are reversed — one drop in the in-order sequence.', args: [[1, 2]], expected: [2, 1] },
    { scenario: 'Adjacent in-order swap', hint: 'Only ONE drop appears when the swapped values are neighbours in sorted order. Assuming two drops leaves `second` unset.', args: [[2, 3, 1]], expected: [2, 1, 3] },
    { scenario: 'Non-adjacent swap', hint: 'Two drops: the first wrong value is `prev` at the first drop, the second is `node` at the last drop.', args: [[4, 2, 6, 1, 7, 5, 3]], expected: [4, 2, 6, 1, 3, 5, 7] },
    { scenario: 'Root swapped with leaf', hint: 'The root value is wrong; swap values only, never relink nodes.', args: [[2, null, 1]], expected: [1, null, 2] },
    { scenario: 'Minimum int value', hint: 'Values include -2^31; don\'t use it as a sentinel for "no previous".', args: [[5, 3, 9, -2147483648, 2]], expected: [5, 2, 9, -2147483648, 3] },
    { scenario: 'Maximum int value', hint: 'Values include 2^31 − 1 at the wrong place.', args: [[5, 2147483647, 3]], expected: [5, 3, 2147483647] },
    { scenario: 'Min and max swapped', hint: 'The smallest and largest values have traded places.', args: [[4, 2, 6, 7, 3, 5, 1]], expected: [4, 2, 6, 1, 3, 5, 7] },
    { scenario: 'Swap in left subtree', hint: 'Both misplaced nodes are inside the root\'s left subtree.', args: [[8, 3, 10, 1, 4, null, 14, null, null, 6, 7, 13]], expected: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13] },
    { scenario: 'Negative values', hint: 'Negative values sort the same way.', args: [[-3, -1, -5]], expected: [-3, -5, -1] },
    { scenario: 'Large tree, far swap (n = 1000)', hint: '1000 nodes with values 1 and 1000 swapped.', argsGen: '() => { const a = ((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(1000); const i = a.indexOf(1), j = a.indexOf(1000); [a[i], a[j]] = [a[j], a[i]]; return [a]; }', expected: [500, 250, 750, 125, 375, 625, 875, 62, 187, 312, 437, 562, 687, 812, 938, 31, 93, 156, 218, 281, 343, 406, 468, 531, 593, 656, 718, 781, 843, 906, 969, 15, 46, 77, 109, 140, 171, 202, 234, 265, 296, 327, 359, 390, 421, 452, 484, 515, 546, 577, 609, 640, 671, 702, 734, 765, 796, 827, 859, 890, 922, 953, 985, 7, 23, 38, 54, 69, 85, 101, 117, 132, 148, 163, 179, 194, 210, 226, 242, 257, 273, 288, 304, 319, 335, 351, 367, 382, 398, 413, 429, 444, 460, 476, 492, 507, 523, 538, 554, 569, 585, 601, 617, 632, 648, 663, 679, 694, 710, 726, 742, 757, 773, 788, 804, 819, 835, 851, 867, 882, 898, 914, 930, 945, 961, 977, 993, 3, 11, 19, 27, 34, 42, 50, 58, 65, 73, 81, 89, 97, 105, 113, 121, 128, 136, 144, 152, 159, 167, 175, 183, 190, 198, 206, 214, 222, 230, 238, 246, 253, 261, 269, 277, 284, 292, 300, 308, 315, 323, 331, 339, 347, 355, 363, 371, 378, 386, 394, 402, 409, 417, 425, 433, 440, 448, 456, 464, 472, 480, 488, 496, 503, 511, 519, 527, 534, 542, 550, 558, 565, 573, 581, 589, 597, 605, 613, 621, 628, 636, 644, 652, 659, 667, 675, 683, 690, 698, 706, 714, 722, 730, 738, 746, 753, 761, 769, 777, 784, 792, 800, 808, 815, 823, 831, 839, 847, 855, 863, 871, 878, 886, 894, 902, 910, 918, 926, 934, 941, 949, 957, 965, 973, 981, 989, 997, 1, 5, 9, 13, 17, 21, 25, 29, 32, 36, 40, 44, 48, 52, 56, 60, 63, 67, 71, 75, 79, 83, 87, 91, 95, 99, 103, 107, 111, 115, 119, 123, 126, 130, 134, 138, 142, 146, 150, 154, 157, 161, 165, 169, 173, 177, 181, 185, 188, 192, 196, 200, 204, 208, 212, 216, 220, 224, 228, 232, 236, 240, 244, 248, 251, 255, 259, 263, 267, 271, 275, 279, 282, 286, 290, 294, 298, 302, 306, 310, 313, 317, 321, 325, 329, 333, 337, 341, 345, 349, 353, 357, 361, 365, 369, 373, 376, 380, 384, 388, 392, 396, 400, 404, 407, 411, 415, 419, 423, 427, 431, 435, 438, 442, 446, 450, 454, 458, 462, 466, 470, 474, 478, 482, 486, 490, 494, 498, 501, 505, 509, 513, 517, 521, 525, 529, 532, 536, 540, 544, 548, 552, 556, 560, 563, 567, 571, 575, 579, 583, 587, 591, 595, 599, 603, 607, 611, 615, 619, 623, 626, 630, 634, 638, 642, 646, 650, 654, 657, 661, 665, 669, 673, 677, 681, 685, 688, 692, 696, 700, 704, 708, 712, 716, 720, 724, 728, 732, 736, 740, 744, 748, 751, 755, 759, 763, 767, 771, 775, 779, 782, 786, 790, 794, 798, 802, 806, 810, 813, 817, 821, 825, 829, 833, 837, 841, 845, 849, 853, 857, 861, 865, 869, 873, 876, 880, 884, 888, 892, 896, 900, 904, 908, 912, 916, 920, 924, 928, 932, 936, 939, 943, 947, 951, 955, 959, 963, 967, 971, 975, 979, 983, 987, 991, 995, 999, null, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, null, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, null, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, null, 127, 129, 131, 133, 135, 137, 139, 141, 143, 145, 147, 149, 151, 153, 155, null, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, null, 189, 191, 193, 195, 197, 199, 201, 203, 205, 207, 209, 211, 213, 215, 217, 219, 221, 223, 225, 227, 229, 231, 233, 235, 237, 239, 241, 243, 245, 247, 249, null, 252, 254, 256, 258, 260, 262, 264, 266, 268, 270, 272, 274, 276, 278, 280, null, 283, 285, 287, 289, 291, 293, 295, 297, 299, 301, 303, 305, 307, 309, 311, null, 314, 316, 318, 320, 322, 324, 326, 328, 330, 332, 334, 336, 338, 340, 342, 344, 346, 348, 350, 352, 354, 356, 358, 360, 362, 364, 366, 368, 370, 372, 374, null, 377, 379, 381, 383, 385, 387, 389, 391, 393, 395, 397, 399, 401, 403, 405, null, 408, 410, 412, 414, 416, 418, 420, 422, 424, 426, 428, 430, 432, 434, 436, null, 439, 441, 443, 445, 447, 449, 451, 453, 455, 457, 459, 461, 463, 465, 467, 469, 471, 473, 475, 477, 479, 481, 483, 485, 487, 489, 491, 493, 495, 497, 499, null, 502, 504, 506, 508, 510, 512, 514, 516, 518, 520, 522, 524, 526, 528, 530, null, 533, 535, 537, 539, 541, 543, 545, 547, 549, 551, 553, 555, 557, 559, 561, null, 564, 566, 568, 570, 572, 574, 576, 578, 580, 582, 584, 586, 588, 590, 592, 594, 596, 598, 600, 602, 604, 606, 608, 610, 612, 614, 616, 618, 620, 622, 624, null, 627, 629, 631, 633, 635, 637, 639, 641, 643, 645, 647, 649, 651, 653, 655, null, 658, 660, 662, 664, 666, 668, 670, 672, 674, 676, 678, 680, 682, 684, 686, null, 689, 691, 693, 695, 697, 699, 701, 703, 705, 707, 709, 711, 713, 715, 717, 719, 721, 723, 725, 727, 729, 731, 733, 735, 737, 739, 741, 743, 745, 747, 749, null, 752, 754, 756, 758, 760, 762, 764, 766, 768, 770, 772, 774, 776, 778, 780, null, 783, 785, 787, 789, 791, 793, 795, 797, 799, 801, 803, 805, 807, 809, 811, null, 814, 816, 818, 820, 822, 824, 826, 828, 830, 832, 834, 836, 838, 840, 842, 844, 846, 848, 850, 852, 854, 856, 858, 860, 862, 864, 866, 868, 870, 872, 874, null, 877, 879, 881, 883, 885, 887, 889, 891, 893, 895, 897, 899, 901, 903, 905, 907, 909, 911, 913, 915, 917, 919, 921, 923, 925, 927, 929, 931, 933, 935, 937, null, 940, 942, 944, 946, 948, 950, 952, 954, 956, 958, 960, 962, 964, 966, 968, 970, 972, 974, 976, 978, 980, 982, 984, 986, 988, 990, 992, 994, 996, 998, 1000] },
    { scenario: 'Large tree, adjacent swap', hint: '1000 nodes, values 500 and 501 swapped — only one drop.', argsGen: '() => { const a = ((n) => { const b = (lo, hi) => { if (lo > hi) return null; const m = (lo + hi) >> 1; return new TreeNode(m * 1 + 0, b(lo, m - 1), b(m + 1, hi)); }; return treeToArray(b(1, n)); })(1000); const i = a.indexOf(500), j = a.indexOf(501); [a[i], a[j]] = [a[j], a[i]]; return [a]; }', expected: [500, 250, 750, 125, 375, 625, 875, 62, 187, 312, 437, 562, 687, 812, 938, 31, 93, 156, 218, 281, 343, 406, 468, 531, 593, 656, 718, 781, 843, 906, 969, 15, 46, 77, 109, 140, 171, 202, 234, 265, 296, 327, 359, 390, 421, 452, 484, 515, 546, 577, 609, 640, 671, 702, 734, 765, 796, 827, 859, 890, 922, 953, 985, 7, 23, 38, 54, 69, 85, 101, 117, 132, 148, 163, 179, 194, 210, 226, 242, 257, 273, 288, 304, 319, 335, 351, 367, 382, 398, 413, 429, 444, 460, 476, 492, 507, 523, 538, 554, 569, 585, 601, 617, 632, 648, 663, 679, 694, 710, 726, 742, 757, 773, 788, 804, 819, 835, 851, 867, 882, 898, 914, 930, 945, 961, 977, 993, 3, 11, 19, 27, 34, 42, 50, 58, 65, 73, 81, 89, 97, 105, 113, 121, 128, 136, 144, 152, 159, 167, 175, 183, 190, 198, 206, 214, 222, 230, 238, 246, 253, 261, 269, 277, 284, 292, 300, 308, 315, 323, 331, 339, 347, 355, 363, 371, 378, 386, 394, 402, 409, 417, 425, 433, 440, 448, 456, 464, 472, 480, 488, 496, 503, 511, 519, 527, 534, 542, 550, 558, 565, 573, 581, 589, 597, 605, 613, 621, 628, 636, 644, 652, 659, 667, 675, 683, 690, 698, 706, 714, 722, 730, 738, 746, 753, 761, 769, 777, 784, 792, 800, 808, 815, 823, 831, 839, 847, 855, 863, 871, 878, 886, 894, 902, 910, 918, 926, 934, 941, 949, 957, 965, 973, 981, 989, 997, 1, 5, 9, 13, 17, 21, 25, 29, 32, 36, 40, 44, 48, 52, 56, 60, 63, 67, 71, 75, 79, 83, 87, 91, 95, 99, 103, 107, 111, 115, 119, 123, 126, 130, 134, 138, 142, 146, 150, 154, 157, 161, 165, 169, 173, 177, 181, 185, 188, 192, 196, 200, 204, 208, 212, 216, 220, 224, 228, 232, 236, 240, 244, 248, 251, 255, 259, 263, 267, 271, 275, 279, 282, 286, 290, 294, 298, 302, 306, 310, 313, 317, 321, 325, 329, 333, 337, 341, 345, 349, 353, 357, 361, 365, 369, 373, 376, 380, 384, 388, 392, 396, 400, 404, 407, 411, 415, 419, 423, 427, 431, 435, 438, 442, 446, 450, 454, 458, 462, 466, 470, 474, 478, 482, 486, 490, 494, 498, 501, 505, 509, 513, 517, 521, 525, 529, 532, 536, 540, 544, 548, 552, 556, 560, 563, 567, 571, 575, 579, 583, 587, 591, 595, 599, 603, 607, 611, 615, 619, 623, 626, 630, 634, 638, 642, 646, 650, 654, 657, 661, 665, 669, 673, 677, 681, 685, 688, 692, 696, 700, 704, 708, 712, 716, 720, 724, 728, 732, 736, 740, 744, 748, 751, 755, 759, 763, 767, 771, 775, 779, 782, 786, 790, 794, 798, 802, 806, 810, 813, 817, 821, 825, 829, 833, 837, 841, 845, 849, 853, 857, 861, 865, 869, 873, 876, 880, 884, 888, 892, 896, 900, 904, 908, 912, 916, 920, 924, 928, 932, 936, 939, 943, 947, 951, 955, 959, 963, 967, 971, 975, 979, 983, 987, 991, 995, 999, null, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, null, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, null, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, null, 127, 129, 131, 133, 135, 137, 139, 141, 143, 145, 147, 149, 151, 153, 155, null, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, null, 189, 191, 193, 195, 197, 199, 201, 203, 205, 207, 209, 211, 213, 215, 217, 219, 221, 223, 225, 227, 229, 231, 233, 235, 237, 239, 241, 243, 245, 247, 249, null, 252, 254, 256, 258, 260, 262, 264, 266, 268, 270, 272, 274, 276, 278, 280, null, 283, 285, 287, 289, 291, 293, 295, 297, 299, 301, 303, 305, 307, 309, 311, null, 314, 316, 318, 320, 322, 324, 326, 328, 330, 332, 334, 336, 338, 340, 342, 344, 346, 348, 350, 352, 354, 356, 358, 360, 362, 364, 366, 368, 370, 372, 374, null, 377, 379, 381, 383, 385, 387, 389, 391, 393, 395, 397, 399, 401, 403, 405, null, 408, 410, 412, 414, 416, 418, 420, 422, 424, 426, 428, 430, 432, 434, 436, null, 439, 441, 443, 445, 447, 449, 451, 453, 455, 457, 459, 461, 463, 465, 467, 469, 471, 473, 475, 477, 479, 481, 483, 485, 487, 489, 491, 493, 495, 497, 499, null, 502, 504, 506, 508, 510, 512, 514, 516, 518, 520, 522, 524, 526, 528, 530, null, 533, 535, 537, 539, 541, 543, 545, 547, 549, 551, 553, 555, 557, 559, 561, null, 564, 566, 568, 570, 572, 574, 576, 578, 580, 582, 584, 586, 588, 590, 592, 594, 596, 598, 600, 602, 604, 606, 608, 610, 612, 614, 616, 618, 620, 622, 624, null, 627, 629, 631, 633, 635, 637, 639, 641, 643, 645, 647, 649, 651, 653, 655, null, 658, 660, 662, 664, 666, 668, 670, 672, 674, 676, 678, 680, 682, 684, 686, null, 689, 691, 693, 695, 697, 699, 701, 703, 705, 707, 709, 711, 713, 715, 717, 719, 721, 723, 725, 727, 729, 731, 733, 735, 737, 739, 741, 743, 745, 747, 749, null, 752, 754, 756, 758, 760, 762, 764, 766, 768, 770, 772, 774, 776, 778, 780, null, 783, 785, 787, 789, 791, 793, 795, 797, 799, 801, 803, 805, 807, 809, 811, null, 814, 816, 818, 820, 822, 824, 826, 828, 830, 832, 834, 836, 838, 840, 842, 844, 846, 848, 850, 852, 854, 856, 858, 860, 862, 864, 866, 868, 870, 872, 874, null, 877, 879, 881, 883, 885, 887, 889, 891, 893, 895, 897, 899, 901, 903, 905, 907, 909, 911, 913, 915, 917, 919, 921, 923, 925, 927, 929, 931, 933, 935, 937, null, 940, 942, 944, 946, 948, 950, 952, 954, 956, 958, 960, 962, 964, 966, 968, 970, 972, 974, 976, 978, 980, 982, 984, 986, 988, 990, 992, 994, 996, 998, 1000] },
  ],

  solution: {
    code: `function recoverTree(root) {
  let first = null, second = null, prev = null;
  const stack = [];
  let node = root;
  while (node || stack.length) {
    while (node) { stack.push(node); node = node.left; }
    node = stack.pop();
    if (prev && prev.val > node.val) {   // a drop in the sorted order
      if (!first) first = prev;          // too-big value appears early
      second = node;                     // too-small value appears late
    }
    prev = node;
    node = node.right;
  }
  [first.val, second.val] = [second.val, first.val];
}`,
  },
  dryRun: {
    columns: ['in-order visit', 'prev', 'drop?', 'first', 'second'],
    rows: [
      ['1', '—', '—', '—', '—'], ['2', '1', 'no', '—', '—'], ['7', '2', 'no', '—', '—'],
      ['4', '7', 'yes', '7', '4'], ['5', '4', 'no', '7', '4'], ['6', '5', 'no', '7', '4'], ['3', '6', 'yes', '7', '3'],
    ],
    note: 'Tree [4,2,6,1,7,5,3]: swap 7 and 3 → in-order 1 2 3 4 5 6 7.',
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'One in-order pass; the stack holds one root-to-leaf path. Morris traversal reduces space to O(1).' },
  alternative: {
    title: 'Morris in-order (O(1) space)',
    md: 'For each node with a left child, find its in-order predecessor; if the predecessor\'s right pointer is null, thread it to the current node and go left; otherwise remove the thread, visit, and go right. Apply the same drop detection during the visits.',
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Assuming there are always two drops — adjacent swaps create only one.',
    'Taking `node` at the first drop instead of `prev` (the too-big value is the earlier one).',
    'Swapping nodes (relinking) instead of just swapping their values.',
  ],
};
