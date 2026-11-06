class Solution {
    public int[] sortArrayByParity(int[] nums) {
        int store = 0;                          // nums[0..store) are even
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] % 2 == 0) {
                int t = nums[i];
                nums[i] = nums[store];
                nums[store] = t;
                store++;
            }
        }
        return nums;
    }
}
