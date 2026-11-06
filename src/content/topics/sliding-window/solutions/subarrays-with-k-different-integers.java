class Solution {
    public int subarraysWithKDistinct(int[] nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);
    }

    // Number of subarrays with at most K distinct values.
    private int atMost(int[] nums, int K) {
        Map<Integer, Integer> count = new HashMap<>();
        int left = 0, total = 0;
        for (int right = 0; right < nums.length; right++) {
            count.merge(nums[right], 1, (a, b) -> a + b);
            while (count.size() > K) {
                int v = nums[left++];
                if (count.merge(v, -1, (a, b) -> a + b) == 0) count.remove(v);
            }
            total += right - left + 1; // subarrays [left..right], [left+1..right], …, [right..right]
        }
        return total;
    }
}
