class Solution {
    public String reorganizeString(String s) {
        Map<Character, Integer> count = new HashMap<>();
        for (char c : s.toCharArray()) count.merge(c, 1, (a, b) -> a + b);
        if (Collections.max(count.values()) > (s.length() + 1) / 2) return "";
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> b[1] - a[1]); // [char, remaining]
        for (var e : count.entrySet()) heap.add(new int[]{e.getKey(), e.getValue()});
        StringBuilder out = new StringBuilder();
        int[] held = null;                           // placed last step; must wait one turn
        while (!heap.isEmpty()) {
            int[] cur = heap.poll();
            out.append((char) cur[0]);
            cur[1]--;
            if (held != null && held[1] > 0) heap.add(held); // previous char may be used again now
            held = cur;
        }
        return out.length() == s.length() ? out.toString() : "";
    }
}
