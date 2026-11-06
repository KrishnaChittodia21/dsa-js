class Solution {
    public void nextPermutation(int[] nums) {
        int n = nums.length;
        int i = n - 2;
        while (i >= 0 && nums[i] >= nums[i + 1]) i--;   // 1. pivot
        if (i >= 0) {
            int j = n - 1;
            while (nums[j] <= nums[i]) j--;              // 2. rightmost value > pivot
            swap(nums, i, j);
        }
        // 3. reverse the (non-increasing) suffix to make it ascending
        for (int l = i + 1, r = n - 1; l < r; l++, r--) swap(nums, l, r);
    }

    private void swap(int[] a, int i, int j) {
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }
}
