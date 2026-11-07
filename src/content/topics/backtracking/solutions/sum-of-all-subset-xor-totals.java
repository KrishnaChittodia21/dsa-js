class Solution {
    public int subsetXORSum(int[] nums) {
        return dfs(nums, 0, 0);
    }

    // sum of XOR totals of all subsets that extend the current choice
    private int dfs(int[] nums, int i, int xor) {
        if (i == nums.length) return xor;      // one complete subset
        return dfs(nums, i + 1, xor ^ nums[i]) // include nums[i]
             + dfs(nums, i + 1, xor);          // exclude nums[i]
    }
}
