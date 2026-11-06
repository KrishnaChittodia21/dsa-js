class Solution {
    public boolean repeatedSubstringPattern(String s) {
        int n = s.length();
        int[] lps = new int[n];
        for (int i = 1, len = 0; i < n; i++) {
            while (len > 0 && s.charAt(i) != s.charAt(len)) len = lps[len - 1];
            if (s.charAt(i) == s.charAt(len)) len++;
            lps[i] = len;
        }
        int border = lps[n - 1];
        int period = n - border;            // smallest period of s
        return border > 0 && n % period == 0;
    }
}
