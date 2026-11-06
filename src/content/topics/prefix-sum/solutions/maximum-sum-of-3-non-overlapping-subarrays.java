class Solution {
    public int[] maxSumOfThreeSubarrays(int[] nums, int k) {
        int n = nums.length;
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];

        int m = n - k + 1;                    // number of possible block starts
        long[] w = new long[m];
        for (int i = 0; i < m; i++) w[i] = prefix[i + k] - prefix[i];

        // left[i]: start of the best block in w[0..i] (earliest on ties)
        int[] left = new int[m];
        int best = 0;
        for (int i = 0; i < m; i++) {
            if (w[i] > w[best]) best = i;
            left[i] = best;
        }
        // right[i]: start of the best block in w[i..m-1] (earliest on ties)
        int[] right = new int[m];
        best = m - 1;
        for (int i = m - 1; i >= 0; i--) {
            if (w[i] >= w[best]) best = i;
            right[i] = best;
        }

        int[] answer = null;
        long bestTotal = Long.MIN_VALUE;
        for (int j = k; j + k < m; j++) {     // middle block start
            int a = left[j - k], c = right[j + k];
            long total = w[a] + w[j] + w[c];
            if (total > bestTotal) {          // strictly better only -> keeps smallest indices
                bestTotal = total;
                answer = new int[]{a, j, c};
            }
        }
        return answer;
    }
}
