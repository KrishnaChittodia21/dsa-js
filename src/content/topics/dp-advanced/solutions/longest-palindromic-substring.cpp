class Solution {
public:
    string longestPalindrome(string s) {
        int start = 0, bestLen = 0;
        for (int c = 0; c < (int)s.size(); c++) {
            int odd = expand(s, c, c);        // center on a character
            int even = expand(s, c, c + 1);   // center on the gap after it
            int len = max(odd, even);
            if (len > bestLen) {
                bestLen = len;
                start = c - (len - 1) / 2;
            }
        }
        return s.substr(start, bestLen);
    }

private:
    // expand from the center (l, r) and return the palindrome's length
    int expand(const string& s, int l, int r) {
        while (l >= 0 && r < (int)s.size() && s[l] == s[r]) { l--; r++; }
        return r - l - 1;
    }
};
