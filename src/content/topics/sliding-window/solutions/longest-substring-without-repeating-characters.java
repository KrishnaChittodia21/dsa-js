class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> lastSeen = new HashMap<>(); // char -> last index where we saw it
        int left = 0;
        int best = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            // Only a copy INSIDE the window (index >= left) makes it invalid.
            Integer prev = lastSeen.get(ch);
            if (prev != null && prev >= left) {
                left = prev + 1;
            }
            lastSeen.put(ch, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
