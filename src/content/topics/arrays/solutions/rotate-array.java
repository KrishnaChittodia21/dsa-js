class Solution {
    public void rotate(int[] nums, int k) {
        int n = nums.length;
        k %= n;                          // rotating by n is a full circle
        reverse(nums, 0, n - 1);   // [A B] → [rev(B) rev(A)]
        reverse(nums, 0, k - 1);   // → [B rev(A)]
        reverse(nums, k, n - 1);   // → [B A]
    }

    private void reverse(int[] nums, int lo, int hi) {
        while (lo < hi) {
            int tmp = nums[lo];
            nums[lo] = nums[hi];
            nums[hi] = tmp;
            lo++;
            hi--;
        }
    }
}
