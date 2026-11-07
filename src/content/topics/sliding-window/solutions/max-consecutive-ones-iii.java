class Solution {
    public int longestOnes(int[] nums, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < nums.length; right++) {
            if (nums[right] == 0) zeros++;           // expand
            while (zeros > k) {                      // too many zeros → repair
                if (nums[left] == 0) zeros--;
                left++;
            }
            best = Math.max(best, right - left + 1); // window has ≤ k zeros
        }
        return best;
    }
}
