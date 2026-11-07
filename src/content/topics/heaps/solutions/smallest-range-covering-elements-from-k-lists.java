class Solution {
    public int[] smallestRange(int[][] nums) {
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0])); // [value, list, index]
        int curMax = Integer.MIN_VALUE;
        for (int i = 0; i < nums.length; i++) {
            pq.add(new int[]{nums[i][0], i, 0});
            curMax = Math.max(curMax, nums[i][0]);
        }
        int[] best = {pq.peek()[0], curMax};
        while (true) {
            int[] top = pq.poll();
            int minVal = top[0], i = top[1], j = top[2];
            // long: the width of a range can pass 2^31
            if ((long) curMax - minVal < (long) best[1] - best[0]) best = new int[]{minVal, curMax};
            if (j + 1 == nums[i].length) break;       // list i exhausted: cannot cover it any more
            int next = nums[i][j + 1];
            pq.add(new int[]{next, i, j + 1});
            curMax = Math.max(curMax, next);
        }
        return best;
    }
}
