class Solution {
    public int constrainedSubsetSum(int[] nums, int k) {
        int n = nums.length;
        int[] best = new int[n];  // best[i] = best sum of a valid subsequence ending at i
        ArrayDeque<Integer> dq = new ArrayDeque<>();  // indices, best[...] decreasing
        int answer = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            if (!dq.isEmpty() && dq.peekFirst() < i - k) dq.pollFirst();  // too far back
            int prev = dq.isEmpty() ? 0 : Math.max(0, best[dq.peekFirst()]);  // extend or start fresh
            best[i] = nums[i] + prev;
            answer = Math.max(answer, best[i]);
            while (!dq.isEmpty() && best[dq.peekLast()] <= best[i]) dq.pollLast();
            dq.offerLast(i);
        }
        return answer;
    }
}
