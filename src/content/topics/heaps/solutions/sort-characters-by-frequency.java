class Solution {
    public String frequencySort(String s) {
        Map<Character, Integer> count = new HashMap<>();
        for (char c : s.toCharArray()) count.merge(c, 1, (a, b) -> a + b);

        // most frequent first
        PriorityQueue<Character> heap =
            new PriorityQueue<>((a, b) -> Integer.compare(count.get(b), count.get(a)));
        heap.addAll(count.keySet());

        StringBuilder sb = new StringBuilder();
        while (!heap.isEmpty()) {
            char c = heap.poll();
            sb.append(String.valueOf(c).repeat(count.get(c)));
        }
        return sb.toString();
    }
}
