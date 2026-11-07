class Solution {
    private static final int HIGH = 30;             // nums < 2^31 → bits 30..0

    // Binary trie: next[node][bit] is the child index, 0 = none (node 0 is the root).
    private int[][] next;
    private int size = 1;

    public int findMaximumXOR(int[] nums) {
        next = new int[nums.length * (HIGH + 1) + 1][2];
        int best = 0;
        insert(nums[0]);
        for (int x : nums) {
            int node = 0, cur = 0;
            for (int b = HIGH; b >= 0; b--) {
                int want = ((x >> b) & 1) ^ 1;      // opposite bit makes this XOR bit 1
                if (next[node][want] != 0) {
                    cur |= 1 << b;
                    node = next[node][want];
                } else {
                    node = next[node][want ^ 1];
                }
            }
            best = Math.max(best, cur);
            insert(x);
        }
        return best;
    }

    private void insert(int x) {
        int node = 0;
        for (int b = HIGH; b >= 0; b--) {
            int bit = (x >> b) & 1;
            if (next[node][bit] == 0) next[node][bit] = size++;
            node = next[node][bit];
        }
    }
}
