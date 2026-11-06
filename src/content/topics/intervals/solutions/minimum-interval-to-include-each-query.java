class Solution {
    public int[] minInterval(int[][] intervals, int[] queries) {
        int[][] sorted = intervals.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));
        Integer[] order = new Integer[queries.length];
        for (int i = 0; i < order.length; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> Integer.compare(queries[a], queries[b]));
        PriorityQueue<int[]> heap = new PriorityQueue<>((x, y) -> Integer.compare(x[0], y[0])); // items: [size, right]
        int[] ans = new int[queries.length];
        Arrays.fill(ans, -1);

        int i = 0;
        for (int qi : order) {
            int q = queries[qi];
            // 1. every interval that has started by q becomes a candidate
            while (i < sorted.length && sorted[i][0] <= q) {
                int l = sorted[i][0], r = sorted[i][1];
                i++;
                heap.add(new int[]{r - l + 1, r});
            }
            // 2. lazily drop candidates that ended before q (they can't contain later queries either)
            while (!heap.isEmpty() && heap.peek()[1] < q) heap.poll();
            // 3. the smallest remaining size contains q
            if (!heap.isEmpty()) ans[qi] = heap.peek()[0];
        }
        return ans;
    }
}
