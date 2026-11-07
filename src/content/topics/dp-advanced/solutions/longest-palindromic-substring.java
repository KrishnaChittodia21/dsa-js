class Solution {
    public String longestPalindrome(String s) {
        int start = 0, bestLen = 0;
        for (int c = 0; c < s.length(); c++) {
            int odd = expand(s, c, c);        // center on a character
            int even = expand(s, c, c + 1);   // center on the gap after it
            int len = Math.max(odd, even);
            if (len > bestLen) {
                bestLen = len;
                start = c - (len - 1) / 2;
            }
        }
        return s.substring(start, start + bestLen);
    }

    // expand from the center (l, r) and return the palindrome's length
    private int expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
        return r - l - 1;
    }
}
