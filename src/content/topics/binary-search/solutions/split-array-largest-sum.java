class Solution {
    public int splitArray(int[] nums, int k) {
        long lo = 0, hi = 0;
        for (int x : nums) {
            lo = Math.max(lo, x);
            hi += x;
        }
        while (lo < hi) {
            long mid = (lo + hi) / 2;
            if (partsNeeded(nums, mid) <= k) hi = mid;  // limit works → try smaller
            else lo = mid + 1;                          // too many parts → limit too small
        }
        return (int) lo;
    }

    // minimum number of parts if every part sum must be <= limit
    private int partsNeeded(int[] nums, long limit) {
        int parts = 1;
        long sum = 0;
        for (int x : nums) {
            if (sum + x > limit) { parts++; sum = 0; }
            sum += x;
        }
        return parts;
    }
}
