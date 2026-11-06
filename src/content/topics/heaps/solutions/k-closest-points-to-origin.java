class Solution {
    public int[][] kClosest(int[][] points, int k) {
        // farthest of the kept points on top; squared distance, no sqrt needed
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Long.compare(dist(b), dist(a)));
        for (int[] p : points) {
            heap.offer(p);
            if (heap.size() > k) heap.poll();
        }
        return heap.toArray(new int[0][]);
    }

    private long dist(int[] p) {
        return (long) p[0] * p[0] + (long) p[1] * p[1];
    }
}
