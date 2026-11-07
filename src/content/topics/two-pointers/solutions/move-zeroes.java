class Solution {
    public void moveZeroes(int[] nums) {
        int write = 0; // next position for a non-zero
        for (int read = 0; read < nums.length; read++) {
            if (nums[read] != 0) {
                int tmp = nums[write];
                nums[write] = nums[read];
                nums[read] = tmp;
                write++;
            }
        }
    }
}
