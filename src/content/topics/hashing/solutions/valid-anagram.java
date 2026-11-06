class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;   // letters of s add
            count[t.charAt(i) - 'a']--;   // letters of t cancel
        }
        for (int c : count) if (c != 0) return false;
        return true;
    }
}
