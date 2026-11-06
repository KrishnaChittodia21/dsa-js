class KthLargest {
    private final int k;
    private final PriorityQueue<Integer> heap = new PriorityQueue<>(); // the k largest values; top = kth largest

    public KthLargest(int k, int[] nums) {
        this.k = k;
        for (int x : nums) add(x);
    }

    public int add(int val) {
        heap.offer(val);
        if (heap.size() > k) heap.poll(); // evict the weakest
        return heap.peek();
    }
}
