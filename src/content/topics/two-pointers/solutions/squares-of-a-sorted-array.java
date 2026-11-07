class Solution {
    public int[] sortedSquares(int[] nums) {
        int n = nums.length;
        int[] out = new int[n];
        int l = 0, r = n - 1;
        for (int w = n - 1; w >= 0; w--) {       // fill from the largest square down
            if (Math.abs(nums[l]) > Math.abs(nums[r])) {
                out[w] = nums[l] * nums[l];
                l++;
            } else {
                out[w] = nums[r] * nums[r];
                r--;
            }
        }
        return out;
    }
}
