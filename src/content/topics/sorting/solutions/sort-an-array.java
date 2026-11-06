class Solution {
    public int[] sortArray(int[] nums) {
        sort(nums, new int[nums.length], 0, nums.length);
        return nums;
    }

    // sorts nums[lo..hi)
    private void sort(int[] nums, int[] buf, int lo, int hi) {
        if (hi - lo <= 1) return;
        int mid = (lo + hi) >>> 1;
        sort(nums, buf, lo, mid);
        sort(nums, buf, mid, hi);
        int i = lo, j = mid, k = lo;
        while (i < mid && j < hi) {
            buf[k++] = nums[i] <= nums[j] ? nums[i++] : nums[j++];  // <= → stable
        }
        while (i < mid) buf[k++] = nums[i++];
        while (j < hi) buf[k++] = nums[j++];
        for (int t = lo; t < hi; t++) nums[t] = buf[t];
    }
}
