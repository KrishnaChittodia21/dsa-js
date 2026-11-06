class Solution {
    static constexpr long long M1 = 67108859, M2 = 67108837, B = 131;
    vector<long long> h1, h2, p1, p2;

    long long key(int l, int r) {
        long long a = ((h1[r] - h1[l] * p1[r - l]) % M1 + M1) % M1;
        long long b = ((h2[r] - h2[l] * p2[r - l]) % M2 + M2) % M2;
        return a * M2 + b;              // exact, < 2^52
    }

    // start index of a repeated window of length L, or -1
    int check(int L, int n) {
        unordered_set<long long> seen;
        for (int i = 0; i + L <= n; i++) {
            if (!seen.insert(key(i, i + L)).second) return i;
        }
        return -1;
    }

public:
    string longestDupSubstring(string s) {
        int n = s.size();
        h1.assign(n + 1, 0); h2.assign(n + 1, 0);
        p1.assign(n + 1, 1); p2.assign(n + 1, 1);
        for (int i = 0; i < n; i++) {
            long long c = s[i];
            h1[i + 1] = (h1[i] * B + c) % M1; p1[i + 1] = (p1[i] * B) % M1;
            h2[i + 1] = (h2[i] * B + c) % M2; p2[i + 1] = (p2[i] * B) % M2;
        }

        int lo = 1, hi = n - 1, bestLen = 0, bestStart = 0;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            int start = check(mid, n);
            if (start != -1) {          // a duplicate of length mid exists → try longer
                bestLen = mid;
                bestStart = start;
                lo = mid + 1;
            } else {
                hi = mid - 1;           // none of length mid → none longer either
            }
        }
        return s.substr(bestStart, bestLen);
    }
};
