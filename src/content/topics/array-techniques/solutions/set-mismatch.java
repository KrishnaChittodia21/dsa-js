class Solution {
    public int[] findErrorNums(int[] nums) {
        int i = 0;
        while (i < nums.length) {
            int h = nums[i] - 1;
            if (nums[h] != nums[i]) {
                int t = nums[i]; nums[i] = nums[h]; nums[h] = t;   // send nums[i] home
            } else {
                i++;                                                // home, or duplicate
            }
        }
        for (int j = 0; j < nums.length; j++) {
            if (nums[j] != j + 1) return new int[]{nums[j], j + 1};
        }
        return new int[0];
    }
}
