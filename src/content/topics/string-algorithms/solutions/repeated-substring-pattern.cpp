class Solution {
public:
    bool repeatedSubstringPattern(string s) {
        int n = s.size();
        vector<int> lps(n, 0);
        for (int i = 1, len = 0; i < n; i++) {
            while (len > 0 && s[i] != s[len]) len = lps[len - 1];
            if (s[i] == s[len]) len++;
            lps[i] = len;
        }
        int border = lps[n - 1];
        int period = n - border;            // smallest period of s
        return border > 0 && n % period == 0;
    }
};
