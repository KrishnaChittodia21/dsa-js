class Solution {
    public int[][] getSkyline(int[][] buildings) {
        List<int[]> events = new ArrayList<>();
        for (int[] b : buildings) {
            events.add(new int[]{b[0], -b[2]}); // start: negative height
            events.add(new int[]{b[1], b[2]});  // end: positive height
        }
        // x ascending; ties: starts before ends, taller starts first, shorter ends first
        events.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));

        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        heap.add(0);                                   // the ground is always "active"
        Map<Integer, Integer> removed = new HashMap<>(); // height -> pending removals (lazy deletion)
        List<int[]> result = new ArrayList<>();
        int prev = 0;

        for (int[] e : events) {
            int x = e[0], v = e[1];
            if (v < 0) {
                heap.add(-v);
            } else {
                removed.merge(v, 1, (a, b) -> a + b);
            }
            // discard stale maxima
            while (removed.getOrDefault(heap.peek(), 0) > 0) {
                int top = heap.poll();
                removed.merge(top, -1, (a, b) -> a + b);
            }
            int cur = heap.peek();
            if (cur != prev) {
                result.add(new int[]{x, cur});
                prev = cur;
            }
        }
        return result.toArray(new int[0][]);
    }
}
