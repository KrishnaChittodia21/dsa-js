class Solution {
    public int maxSumSubmatrix(int[][] matrix, int k) {
        int rows = matrix.length, cols = matrix[0].length;
        int best = Integer.MIN_VALUE;

        for (int top = 0; top < rows; top++) {
            int[] colSum = new int[cols];
            for (int bottom = top; bottom < rows; bottom++) {
                for (int c = 0; c < cols; c++) colSum[c] += matrix[bottom][c];

                // Shortcut: unbounded best via Kadane. If it already fits under k, it is optimal.
                int cur = colSum[0], kad = colSum[0];
                for (int c = 1; c < cols; c++) {
                    cur = Math.max(colSum[c], cur + colSum[c]);
                    kad = Math.max(kad, cur);
                }
                if (kad <= k) { best = Math.max(best, kad); continue; }

                // Otherwise: best P[r] - P[l] <= k  <=>  smallest earlier prefix P[l] >= P[r] - k.
                TreeSet<Integer> sorted = new TreeSet<>(); // prefixes seen so far
                sorted.add(0);
                int prefix = 0;
                for (int c = 0; c < cols; c++) {
                    prefix += colSum[c];
                    Integer ceil = sorted.ceiling(prefix - k);
                    if (ceil != null) best = Math.max(best, prefix - ceil);
                    sorted.add(prefix);
                }
                if (best == k) return k; // cannot do better than k
            }
        }
        return best;
    }
}
