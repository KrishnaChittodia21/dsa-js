class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int w : stones) heap.offer(w);
        while (heap.size() > 1) {
            int y = heap.poll();             // heaviest
            int x = heap.poll();             // second heaviest
            if (y != x) heap.offer(y - x);   // the remainder goes back
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }
}
