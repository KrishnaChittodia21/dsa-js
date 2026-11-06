class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int l = 0, r = numbers.length - 1;
        while (l < r) {
            int sum = numbers[l] + numbers[r];
            if (sum == target) return new int[]{l + 1, r + 1}; // 1-based
            if (sum < target) l++;                             // need a bigger sum
            else r--;                                          // need a smaller sum
        }
        return new int[]{-1, -1}; // unreachable: a solution is guaranteed
    }
}
