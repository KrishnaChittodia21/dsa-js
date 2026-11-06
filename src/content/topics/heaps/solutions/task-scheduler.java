class Solution {
    public int leastInterval(char[] tasks, int n) {
        Map<Character, Integer> count = new HashMap<>();
        for (char t : tasks) count.merge(t, 1, (a, b) -> a + b);
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        heap.addAll(count.values());
        int time = 0;
        while (!heap.isEmpty()) {
            List<Integer> leftovers = new ArrayList<>();
            int ran = 0;
            // one round: up to n + 1 DIFFERENT tasks, most frequent first
            while (ran < n + 1 && !heap.isEmpty()) {
                int c = heap.poll() - 1;
                if (c > 0) leftovers.add(c);
                ran++;
            }
            heap.addAll(leftovers);
            time += heap.isEmpty() ? ran : n + 1;   // last round has no trailing idle
        }
        return time;
    }
}
