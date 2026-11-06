class Solution {
    public String minWindow(String s, String t) {
        Map<Character, Integer> need = new HashMap<>();
        for (char c : t.toCharArray()) need.merge(c, 1, (a, b) -> a + b);

        int missing = t.length();       // characters still required
        int left = 0;
        int bestStart = 0, bestLen = Integer.MAX_VALUE;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (need.getOrDefault(c, 0) > 0) missing--;
            need.merge(c, -1, (a, b) -> a + b);

            while (missing == 0) {      // window covers t → try to shrink it
                if (right - left + 1 < bestLen) {
                    bestLen = right - left + 1;
                    bestStart = left;
                }
                char out = s.charAt(left);
                need.merge(out, 1, (a, b) -> a + b);
                if (need.get(out) > 0) missing++;  // we just removed a required char
                left++;
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
    }
}
