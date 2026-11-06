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
    public int[] countSmaller(int[] nums) {
        int[] sorted = Arrays.stream(nums).distinct().sorted().toArray();
        FenwickTree bit = new FenwickTree(sorted.length);
        int[] counts = new int[nums.length];

        for (int i = nums.length - 1; i >= 0; i--) {
            int r = Arrays.binarySearch(sorted, nums[i]);
            counts[i] = r > 0 ? bit.prefixSum(r - 1) : 0;   // seen (= to the right) and strictly smaller
            bit.add(r, 1);                                  // now nums[i] is "seen"
        }
        return counts;
    }
}
