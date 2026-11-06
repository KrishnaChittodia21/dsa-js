class Solution {
    private List<int[]> result = new ArrayList<>();
    private int[] path;

    public int[][] combine(int n, int k) {
        path = new int[k];
        backtrack(n, k, 1, 0);
        return result.toArray(new int[0][]);
    }

    private void backtrack(int n, int k, int start, int len) {
        if (len == k) {
            result.add(path.clone());
            return;
        }
        int need = k - len;
        // x can go no further than n - need + 1, otherwise too few numbers remain
        for (int x = start; x <= n - need + 1; x++) {
            path[len] = x;
            backtrack(n, k, x + 1, len + 1);
        }
    }
}
