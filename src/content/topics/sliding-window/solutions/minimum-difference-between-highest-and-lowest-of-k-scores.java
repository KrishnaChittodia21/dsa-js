class Solution {
    public int minimumDifference(int[] nums, int k) {
        int[] sorted = nums.clone(); // don't mutate input
        Arrays.sort(sorted);
        int best = Integer.MAX_VALUE;
        for (int i = 0; i + k - 1 < sorted.length; i++) {
            best = Math.min(best, sorted[i + k - 1] - sorted[i]); // window [i, i+k-1]
        }
        return best;
    }
}
