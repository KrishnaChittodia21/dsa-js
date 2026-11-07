class Solution {
    public long pickGifts(int[] gifts, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int g : gifts) heap.add(g);
        for (int t = 0; t < k; t++) {
            int top = heap.poll();
            heap.add((int) Math.sqrt(top)); // leave floor(sqrt) gifts in the pile
        }
        long total = 0; // up to 10^12
        for (int g : heap) total += g;
        return total;
    }
}
