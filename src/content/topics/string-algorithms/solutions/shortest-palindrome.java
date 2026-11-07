class Solution {
    public String shortestPalindrome(String s) {
        String rev = new StringBuilder(s).reverse().toString();
        String t = s + "#" + rev;
        int[] lps = new int[t.length()];
        for (int i = 1, len = 0; i < t.length(); i++) {
            while (len > 0 && t.charAt(i) != t.charAt(len)) len = lps[len - 1];
            if (t.charAt(i) == t.charAt(len)) len++;
            lps[i] = len;
        }
        int k = lps[t.length() - 1];                    // longest palindromic prefix of s
        return rev.substring(0, s.length() - k) + s;    // = reverse(s.substring(k)) + s
    }
}
