class Solution {
    public int shortestSubarray(int[] nums, int k) {
        int n = nums.length;
        long[] P = new long[n + 1];  // P[j] = sum of nums[0..j-1]
        for (int i = 0; i < n; i++) P[i + 1] = P[i] + nums[i];

        ArrayDeque<Integer> dq = new ArrayDeque<>();  // candidate start indices, P increasing
        int best = Integer.MAX_VALUE;
        for (int j = 0; j <= n; j++) {
            // Front rule: a valid subarray ends here; later ends can only be longer.
            while (!dq.isEmpty() && P[j] - P[dq.peekFirst()] >= k) {
                best = Math.min(best, j - dq.pollFirst());
            }
            // Back rule: j is a later start with a smaller-or-equal prefix -> dominates.
            while (!dq.isEmpty() && P[dq.peekLast()] >= P[j]) dq.pollLast();
            dq.offerLast(j);
        }
        return best == Integer.MAX_VALUE ? -1 : best;
    }
}
