class Solution {
    public int countSubstrings(String s) {
        int count = 0;
        for (int c = 0; c < s.length(); c++) {
            count += expand(s, c, c);       // odd length: center is s[c]
            count += expand(s, c, c + 1);   // even length: center is the gap after s[c]
        }
        return count;
    }

    private int expand(String s, int l, int r) {
        int count = 0;
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
            count++;                        // s[l..r] is a palindrome
            l--;
            r++;
        }
        return count;
    }
}
