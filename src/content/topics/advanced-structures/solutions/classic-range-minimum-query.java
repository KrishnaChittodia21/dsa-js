class Solution {
    public int[] rangeMinQuery(int[] nums, int[][] queries) {
        int n = nums.length;
        int[] log = new int[n + 1];
        for (int i = 2; i <= n; i++) log[i] = log[i >> 1] + 1;   // floor(log2 i)

        // st[k][i] = min of nums[i .. i + 2^k - 1]
        int[][] st = new int[log[n] + 1][];
        st[0] = nums.clone();
        for (int k = 1; (1 << k) <= n; k++) {
            int half = 1 << (k - 1);
            st[k] = new int[n - (1 << k) + 1];
            for (int i = 0; i < st[k].length; i++) st[k][i] = Math.min(st[k - 1][i], st[k - 1][i + half]);
        }

        int[] res = new int[queries.length];
        for (int q = 0; q < queries.length; q++) {
            int l = queries[q][0], r = queries[q][1];
            int k = log[r - l + 1];
            res[q] = Math.min(st[k][l], st[k][r - (1 << k) + 1]);   // two overlapping blocks
        }
        return res;
    }
}
