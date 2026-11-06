class Solution {
    private static final int BITS = 30;          // values <= 1e9 < 2^30

    public int[] maximizeXor(int[] nums, int[][] queries) {
        int[][] kids = new int[nums.length * BITS + 1][2];   // child indices per node; 0 = missing
        int size = 1;

        int[] sorted = nums.clone();
        Arrays.sort(sorted);
        Integer[] order = new Integer[queries.length];
        for (int i = 0; i < order.length; i++) order[i] = i;
        Arrays.sort(order, (i, j) -> Integer.compare(queries[i][1], queries[j][1]));

        int[] ans = new int[queries.length];
        int p = 0;
        for (int qi : order) {
            int x = queries[qi][0], m = queries[qi][1];
            while (p < sorted.length && sorted[p] <= m) {
                int v = sorted[p++], node = 0;
                for (int b = BITS - 1; b >= 0; b--) {
                    int bit = (v >> b) & 1;
                    if (kids[node][bit] == 0) kids[node][bit] = size++;
                    node = kids[node][bit];
                }
            }
            if (p == 0) { ans[qi] = -1; continue; }   // empty trie: no allowed element
            int node = 0, res = 0;
            for (int b = BITS - 1; b >= 0; b--) {
                int bit = (x >> b) & 1;
                if (kids[node][bit ^ 1] != 0) { res |= 1 << b; node = kids[node][bit ^ 1]; }
                else node = kids[node][bit];
            }
            ans[qi] = res;
        }
        return ans;
    }
}
