class Solution {
    public int numSubmatrixSumTarget(int[][] matrix, int target) {
        int m = matrix.length, n = matrix[0].length;
        int total = 0;
        for (int top = 0; top < m; top++) {
            int[] colSum = new int[n];
            for (int bottom = top; bottom < m; bottom++) {
                for (int c = 0; c < n; c++) colSum[c] += matrix[bottom][c]; // squash rows top..bottom

                // Count subarrays of colSum with sum == target (Subarray Sum Equals K).
                Map<Integer, Integer> seen = new HashMap<>();
                seen.put(0, 1);
                int cur = 0;
                for (int c = 0; c < n; c++) {
                    cur += colSum[c];
                    total += seen.getOrDefault(cur - target, 0);
                    seen.merge(cur, 1, (a, b) -> a + b);
                }
            }
        }
        return total;
    }
}
