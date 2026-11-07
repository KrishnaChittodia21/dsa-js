class Solution {
public:
    long long sumScores(string s) {
        int n = s.size();
        vector<int> z(n, 0);
        z[0] = n;                                       // the whole string matches itself
        long long total = n;
        for (int i = 1, l = 0, r = 0; i < n; i++) {     // z-box [l, r)
            if (i < r) z[i] = min(r - i, z[i - l]);                         // reuse the mirror, capped at r
            while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;          // extend beyond known region
            if (i + z[i] > r) {
                l = i;
                r = i + z[i];
            }
            total += z[i];
        }
        return total;
    }
};
