class Solution {
public:
    string longestPrefix(string s) {
        int n = s.size();
        vector<int> lps(n, 0);
        for (int i = 1, len = 0; i < n; i++) {
            while (len > 0 && s[i] != s[len]) len = lps[len - 1]; // try the next shorter border
            if (s[i] == s[len]) len++;
            lps[i] = len;
        }
        return s.substr(0, lps[n - 1]);
    }
};
