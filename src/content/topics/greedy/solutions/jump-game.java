class Solution {
    public boolean canJump(int[] nums) {
        int reach = 0;                          // every index <= reach is reachable
        for (int i = 0; i < nums.length; i++) {
            if (i > reach) return false;        // gap: i cannot be reached
            reach = Math.max(reach, i + nums[i]);
            if (reach >= nums.length - 1) return true;
        }
        return true;
    }
}
