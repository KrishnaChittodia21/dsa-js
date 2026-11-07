class Solution {
    public int[][] kSmallestPairs(int[] nums1, int[] nums2, int k) {
        // [sum, i, j]; sum as long so two large ints cannot overflow
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        for (int i = 0; i < Math.min(k, nums1.length); i++) pq.add(new long[]{(long) nums1[i] + nums2[0], i, 0});
        List<int[]> out = new ArrayList<>();
        while (out.size() < k && !pq.isEmpty()) {
            long[] top = pq.poll();
            int i = (int) top[1], j = (int) top[2];
            out.add(new int[]{nums1[i], nums2[j]});
            if (j + 1 < nums2.length) pq.add(new long[]{(long) nums1[i] + nums2[j + 1], i, j + 1}); // next in row i
        }
        return out.toArray(new int[0][]);
    }
}
