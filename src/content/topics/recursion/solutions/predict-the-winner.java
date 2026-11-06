class Solution {
    public boolean predictTheWinner(int[] nums) {
        int n = nums.length;
        Integer[][] memo = new Integer[n][n];   // memo[i][j] = best difference for the player to move
        return diff(nums, 0, n - 1, memo) >= 0; // ties go to player 1
    }

    private int diff(int[] nums, int i, int j, Integer[][] memo) {
        if (i == j) return nums[i];             // one number left: take it
        if (memo[i][j] != null) return memo[i][j];
        int takeLeft = nums[i] - diff(nums, i + 1, j, memo);  // opponent's best counts against me
        int takeRight = nums[j] - diff(nums, i, j - 1, memo);
        return memo[i][j] = Math.max(takeLeft, takeRight);
    }
}
