class Solution {
    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = lo + ((hi - lo) >> 1);
            if (nums[mid] > nums[hi]) lo = mid + 1; // mid is in the high run → drop is right
            else hi = mid;                          // mid..hi is sorted → min at mid or left
        }
        return nums[lo];
    }
}
