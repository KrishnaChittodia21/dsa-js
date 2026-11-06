class Solution {
    public int maximumScore(int[] nums, int k) {
        int n = nums.length;
        int i = k, j = k, curMin = nums[k];
        long best = nums[k];
        while (i > 0 || j < n - 1) {
            // extend towards the larger neighbour (the only option at an edge)
            if (i == 0) j++;
            else if (j == n - 1) i--;
            else if (nums[j + 1] > nums[i - 1]) j++;
            else i--;
            curMin = Math.min(curMin, Math.min(nums[i], nums[j]));
            best = Math.max(best, (long) curMin * (j - i + 1));
        }
        return (int) best;
    }
}
