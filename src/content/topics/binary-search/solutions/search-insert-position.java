class Solution {
    public int searchInsert(int[] nums, int target) {
        int lo = 0, hi = nums.length;           // answer may be nums.length
        while (lo < hi) {
            int mid = lo + ((hi - lo) >> 1);
            if (nums[mid] >= target) hi = mid;  // mid could be the first >= target
            else lo = mid + 1;
        }
        return lo;
    }
}
