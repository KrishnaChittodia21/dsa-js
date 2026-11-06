class Solution {
    static constexpr long long M1 = 67108859, M2 = 67108837, B = 131;
    vector<long long> h1, h2, p1, p2;

    // exact numeric key for text[l..r): both residues packed into one number
    long long get(int l, int r) {
        long long a = ((h1[r] - h1[l] * p1[r - l]) % M1 + M1) % M1;
        long long b = ((h2[r] - h2[l] * p2[r - l]) % M2 + M2) % M2;
        return a * M2 + b;
    }

public:
    int distinctEchoSubstrings(string text) {
        int n = text.size();
        h1.assign(n + 1, 0); h2.assign(n + 1, 0);
        p1.assign(n + 1, 1); p2.assign(n + 1, 1);
        for (int i = 0; i < n; i++) {
            long long c = text[i];
            h1[i + 1] = (h1[i] * B + c) % M1; p1[i + 1] = (p1[i] * B) % M1;
            h2[i + 1] = (h2[i] * B + c) % M2; p2[i + 1] = (p2[i] * B) % M2;
        }

        int total = 0;
        for (int L = 1; 2 * L <= n; L++) {
            unordered_set<long long> seen;              // echoes of total length 2L
            for (int i = 0; i + 2 * L <= n; i++) {
                if (get(i, i + L) == get(i + L, i + 2 * L)) seen.insert(get(i, i + 2 * L));
            }
            total += seen.size();
        }
        return total;
    }
};
