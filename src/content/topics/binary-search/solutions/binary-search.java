class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;          // closed range [lo, hi]
        while (lo <= hi) {                          // non-empty
            int mid = lo + ((hi - lo) >> 1);
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) lo = mid + 1;   // mid and left are too small
            else hi = mid - 1;                      // mid and right are too big
        }
        return -1;
    }
}
