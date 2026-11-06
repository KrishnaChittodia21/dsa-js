class Solution {
    public int firstUniqChar(String s) {
        int[] count = new int[26];
        ArrayDeque<Integer> q = new ArrayDeque<>();  // indices of characters seen once, in order
        for (int i = 0; i < s.length(); i++) {
            int c = s.charAt(i) - 'a';
            if (count[c]++ == 0) q.offer(i);  // first sighting -> candidate
            // drop candidates that turned into duplicates
            while (!q.isEmpty() && count[s.charAt(q.peek()) - 'a'] > 1) q.poll();
        }
        return q.isEmpty() ? -1 : q.peek();
    }
}
