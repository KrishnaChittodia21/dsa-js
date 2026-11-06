class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> count = new HashMap<>();
        for (int x : nums) count.merge(x, 1, (a, b) -> a + b);

        // [value, count], least frequent on top
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
        for (var e : count.entrySet()) {
            heap.offer(new int[]{e.getKey(), e.getValue()});
            if (heap.size() > k) heap.poll();
        }
        int[] answer = new int[heap.size()];
        int i = 0;
        for (int[] e : heap) answer[i++] = e[0];
        return answer;
    }
}
