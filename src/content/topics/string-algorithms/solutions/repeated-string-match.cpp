class Solution {
public:
    int repeatedStringMatch(string a, string b) {
        int n = a.size(), m = b.size();
        int q = (m + n - 1) / n;

        vector<int> lps(m, 0);
        for (int i = 1, len = 0; i < m; i++) {
            while (len > 0 && b[i] != b[len]) len = lps[len - 1];
            if (b[i] == b[len]) len++;
            lps[i] = len;
        }

        int limit = (q + 1) * n;                      // enough text for any first occurrence
        for (int i = 0, j = 0; i < limit; i++) {
            char c = a[i % n];                        // virtual repeated string, never built
            while (j > 0 && c != b[j]) j = lps[j - 1];
            if (c == b[j]) j++;
            if (j == m) return (i + n) / n;           // copies needed to reach index i
        }
        return -1;
    }
};
