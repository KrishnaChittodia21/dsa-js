class Solution {
    public int deleteAndEarn(int[] nums) {
        int maxVal = 0;
        for (int x : nums) maxVal = Math.max(maxVal, x);
        int[] points = new int[maxVal + 1];
        for (int x : nums) points[x] += x;          // taking value x earns all copies
        // House robber over values: neighbours are v - 1 and v + 1.
        int prev2 = 0, prev1 = 0;
        for (int v = 0; v <= maxVal; v++) {
            int cur = Math.max(prev1, prev2 + points[v]);
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
}
