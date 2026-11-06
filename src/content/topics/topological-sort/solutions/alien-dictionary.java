class Solution {
    public String alienOrder(String[] words) {
        Map<Character, Set<Character>> adj = new LinkedHashMap<>();   // letter → letters that come after it
        Map<Character, Integer> indeg = new HashMap<>();
        for (String w : words) {
            for (char ch : w.toCharArray()) {
                if (!adj.containsKey(ch)) { adj.put(ch, new HashSet<>()); indeg.put(ch, 0); }
            }
        }

        for (int i = 0; i + 1 < words.length; i++) {
            String w1 = words[i], w2 = words[i + 1];
            int len = Math.min(w1.length(), w2.length());
            int j = 0;
            while (j < len && w1.charAt(j) == w2.charAt(j)) j++;
            if (j == len) {
                if (w1.length() > w2.length()) return "";   // "abc" before "ab" is impossible
                continue;                                   // prefix in the right order: no info
            }
            char a = w1.charAt(j), b = w2.charAt(j);
            if (adj.get(a).add(b)) indeg.merge(b, 1, (x, y) -> x + y);   // dedupe so indeg matches adj
        }

        StringBuilder order = new StringBuilder();
        ArrayDeque<Character> queue = new ArrayDeque<>();
        for (char ch : adj.keySet()) if (indeg.get(ch) == 0) queue.add(ch);
        while (!queue.isEmpty()) {
            char ch = queue.poll();
            order.append(ch);
            for (char next : adj.get(ch)) {
                if (indeg.merge(next, -1, (x, y) -> x + y) == 0) queue.add(next);
            }
        }
        return order.length() == adj.size() ? order.toString() : "";   // shorter → cycle
    }
}
