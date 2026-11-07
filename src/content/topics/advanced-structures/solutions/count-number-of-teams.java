class FenwickTree {
    private final int[] tree;

    FenwickTree(int n) {
        tree = new int[n + 1];
    }

    void add(int i, int d) {
        for (i++; i < tree.length; i += i & -i) tree[i] += d;
    }

    int prefixSum(int i) {
        int s = 0;
        for (i++; i > 0; i -= i & -i) s += tree[i];
        return s;
    }
}

class Solution {
    public int numTeams(int[] rating) {
        int n = rating.length;
        int[] sorted = rating.clone();
        Arrays.sort(sorted);                              // distinct → rank = #smaller overall
        FenwickTree bit = new FenwickTree(n);
        long teams = 0;

        for (int j = 0; j < n; j++) {
            int r = Arrays.binarySearch(sorted, rating[j]);
            int leftSmaller = r > 0 ? bit.prefixSum(r - 1) : 0;
            int leftLarger = j - leftSmaller;
            int rightSmaller = r - leftSmaller;
            int rightLarger = (n - 1 - j) - rightSmaller;
            teams += (long) leftSmaller * rightLarger + (long) leftLarger * rightSmaller;
            bit.add(r, 1);
        }
        return (int) teams;
    }
}
