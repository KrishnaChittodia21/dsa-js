class MedianFinder {
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder()); // smaller half; top = largest of the small numbers
    private final PriorityQueue<Integer> high = new PriorityQueue<>();                          // larger half; top = smallest of the large numbers

    public MedianFinder() {
    }

    public void addNum(int num) {
        low.offer(num);
        high.offer(low.poll());              // keep every low <= every high
        if (high.size() > low.size()) {      // keep low the same size or one bigger
            low.offer(high.poll());
        }
    }

    public double findMedian() {
        if (low.size() > high.size()) return low.peek();
        return ((long) low.peek() + high.peek()) / 2.0; // long: the sum can pass 2^31
    }
}
