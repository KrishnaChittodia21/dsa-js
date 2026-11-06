class Solution {
    public String longestPrefix(String s) {
        int n = s.length();
        int[] lps = new int[n];
        for (int i = 1, len = 0; i < n; i++) {
            while (len > 0 && s.charAt(i) != s.charAt(len)) len = lps[len - 1]; // try the next shorter border
            if (s.charAt(i) == s.charAt(len)) len++;
            lps[i] = len;
        }
        return s.substring(0, lps[n - 1]);
    }
}
