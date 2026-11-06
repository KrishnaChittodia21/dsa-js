class Solution {
public:
    int countSubstrings(string s) {
        int n = s.size(), count = 0;
        auto expand = [&](int l, int r) {
            while (l >= 0 && r < n && s[l] == s[r]) {
                count++;                    // s[l..r] is a palindrome
                l--;
                r++;
            }
        };
        for (int c = 0; c < n; c++) {
            expand(c, c);                   // odd length: center is s[c]
            expand(c, c + 1);               // even length: center is the gap after s[c]
        }
        return count;
    }
};
