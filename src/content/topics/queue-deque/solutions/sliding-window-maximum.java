class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        ArrayDeque<Integer> dq = new ArrayDeque<>();  // indices; nums[...] decreasing from front to back
        int[] res = new int[nums.length - k + 1];
        for (int i = 0; i < nums.length; i++) {
            // 1. Older, smaller-or-equal values can never be a maximum again.
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast();
            dq.offerLast(i);
            // 2. The front may have slid out of the window.
            if (dq.peekFirst() <= i - k) dq.pollFirst();
            // 3. Front = maximum of the current window.
            if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];
        }
        return res;
    }
}
