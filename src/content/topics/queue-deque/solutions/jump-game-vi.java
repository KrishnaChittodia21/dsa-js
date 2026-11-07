class Solution {
    public int maxResult(int[] nums, int k) {
        int n = nums.length;
        int[] best = new int[n];                // best[i] = best score standing on i
        Deque<Integer> dq = new ArrayDeque<>(); // indices, best[...] decreasing front → back
        best[0] = nums[0];
        dq.offerLast(0);
        for (int i = 1; i < n; i++) {
            if (dq.peekFirst() < i - k) dq.pollFirst();     // out of jumping range
            best[i] = nums[i] + best[dq.peekFirst()];       // come from the best reachable index
            while (!dq.isEmpty() && best[dq.peekLast()] <= best[i]) dq.pollLast();
            dq.offerLast(i);
        }
        return best[n - 1];
    }
}
