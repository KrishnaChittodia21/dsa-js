class Solution {
    public int firstMissingPositive(int[] nums) {
        int n = nums.length;
        int i = 0;
        while (i < n) {
            int v = nums[i];
            // Only 1..n have a home; skip if the home already holds v (handles duplicates).
            if (v >= 1 && v <= n && nums[v - 1] != v) {
                nums[i] = nums[v - 1];
                nums[v - 1] = v;
            } else {
                i++;
            }
        }
        for (int j = 0; j < n; j++) {
            if (nums[j] != j + 1) return j + 1;
        }
        return n + 1;
    }
}
