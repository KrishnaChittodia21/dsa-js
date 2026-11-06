class Solution {
    public boolean isSubsequence(String s, String t) {
        int i = 0;                           // next character of s to match
        for (int j = 0; j < t.length() && i < s.length(); j++) {
            if (s.charAt(i) == t.charAt(j)) i++;   // greedy match is always safe
        }
        return i == s.length();
    }
}
