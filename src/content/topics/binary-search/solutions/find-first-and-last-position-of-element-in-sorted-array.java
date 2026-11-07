class Solution {
    public int[] searchRange(int[] nums, int target) {
        int first = firstAtLeast(nums, target);
        if (first == nums.length || nums[first] != target) return new int[]{-1, -1};
        int last = firstAtLeast(nums, (long) target + 1) - 1;   // upper bound − 1
        return new int[]{first, last};
    }

    // first index i with nums[i] >= x (nums.length if none)
    private int firstAtLeast(int[] nums, long x) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + ((hi - lo) >> 1);
            if (nums[mid] >= x) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}
