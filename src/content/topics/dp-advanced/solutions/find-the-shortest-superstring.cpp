class Solution {
public:
    string shortestSuperstring(vector<string>& words) {
        int n = words.size();
        // overlap[i][j] = longest suffix of words[i] that is a prefix of words[j]
        vector<vector<int>> overlap(n, vector<int>(n, 0));
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) continue;
                const string& a = words[i];
                const string& b = words[j];
                for (int k = min(a.size(), b.size()) - 1; k > 0; k--) {
                    if (a.compare(a.size() - k, k, b, 0, k) == 0) { overlap[i][j] = k; break; }
                }
            }
        }
        int N = 1 << n;
        vector<vector<int>> dp(N, vector<int>(n, INT_MAX));
        vector<vector<int>> parent(N, vector<int>(n, -1));
        for (int i = 0; i < n; i++) dp[1 << i][i] = words[i].size();
        for (int mask = 1; mask < N; mask++) {
            for (int last = 0; last < n; last++) {
                if (!(mask & (1 << last)) || dp[mask][last] == INT_MAX) continue;
                for (int j = 0; j < n; j++) {
                    if (mask & (1 << j)) continue;
                    int next = mask | (1 << j);
                    int cand = dp[mask][last] + words[j].size() - overlap[last][j];
                    if (cand < dp[next][j]) { dp[next][j] = cand; parent[next][j] = last; }
                }
            }
        }
        // best final word
        int full = N - 1;
        int last = 0;
        for (int i = 1; i < n; i++) if (dp[full][i] < dp[full][last]) last = i;
        // walk parents back to recover the order
        vector<int> order;
        int mask = full;
        while (last != -1) {
            order.push_back(last);
            int prev = parent[mask][last];
            mask ^= 1 << last;
            last = prev;
        }
        reverse(order.begin(), order.end());
        string result = words[order[0]];
        for (size_t t = 1; t < order.size(); t++) {
            result += words[order[t]].substr(overlap[order[t - 1]][order[t]]);
        }
        return result;
    }
};
