class Solution {
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder()); // smaller half
    private final PriorityQueue<Integer> high = new PriorityQueue<>();                         // larger half
    private final Map<Integer, Integer> delayed = new HashMap<>(); // value -> copies logically deleted
    private int lowSize = 0, highSize = 0;                         // live elements only

    public double[] medianSlidingWindow(int[] nums, int k) {
        low.clear(); high.clear(); delayed.clear(); lowSize = highSize = 0;
        double[] out = new double[nums.length - k + 1];
        for (int i = 0; i < nums.length; i++) {
            add(nums[i]);
            if (i >= k) remove(nums[i - k]);
            if (i >= k - 1) {
                // long: the sum of two ints can overflow
                out[i - k + 1] = k % 2 == 1 ? low.peek() : ((long) low.peek() + high.peek()) / 2.0;
            }
        }
        return out;
    }

    private void prune(PriorityQueue<Integer> heap) {
        while (!heap.isEmpty() && delayed.getOrDefault(heap.peek(), 0) > 0) {
            int v = heap.poll();
            delayed.merge(v, -1, (a, b) -> a + b);
        }
    }

    private void rebalance() {
        if (lowSize > highSize + 1) {
            high.offer(low.poll()); lowSize--; highSize++; prune(low);
        } else if (highSize > lowSize) {
            low.offer(high.poll()); highSize--; lowSize++; prune(high);
        }
    }

    private void add(int x) {
        if (low.isEmpty() || x <= low.peek()) { low.offer(x); lowSize++; }
        else { high.offer(x); highSize++; }
        rebalance();
    }

    private void remove(int x) {
        delayed.merge(x, 1, (a, b) -> a + b);
        if (x <= low.peek()) { lowSize--; if (x == low.peek()) prune(low); }
        else { highSize--; if (x == high.peek()) prune(high); }
        rebalance();
    }
}
