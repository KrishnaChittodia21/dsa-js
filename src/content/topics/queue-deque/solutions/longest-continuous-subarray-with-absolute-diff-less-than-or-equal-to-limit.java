class Solution {
    public int longestSubarray(int[] nums, int limit) {
        Deque<Integer> maxD = new ArrayDeque<>();   // indices, nums decreasing → front is the window max
        Deque<Integer> minD = new ArrayDeque<>();   // indices, nums increasing → front is the window min
        int left = 0, best = 0;
        for (int right = 0; right < nums.length; right++) {
            int x = nums[right];
            while (!maxD.isEmpty() && nums[maxD.peekLast()] < x) maxD.pollLast();
            maxD.offerLast(right);
            while (!minD.isEmpty() && nums[minD.peekLast()] > x) minD.pollLast();
            minD.offerLast(right);

            while (nums[maxD.peekFirst()] - nums[minD.peekFirst()] > limit) {
                left++;                                         // shrink
                if (maxD.peekFirst() < left) maxD.pollFirst();  // expired
                if (minD.peekFirst() < left) minD.pollFirst();
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
