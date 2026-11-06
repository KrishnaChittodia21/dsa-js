class Solution {
    private static final long M1 = 67108859, M2 = 67108837, B = 131;
    private long[] h1, h2, p1, p2;

    public String longestDupSubstring(String s) {
        int n = s.length();
        h1 = new long[n + 1]; h2 = new long[n + 1];
        p1 = new long[n + 1]; p2 = new long[n + 1];
        p1[0] = p2[0] = 1;
        for (int i = 0; i < n; i++) {
            int c = s.charAt(i);
            h1[i + 1] = (h1[i] * B + c) % M1; p1[i + 1] = (p1[i] * B) % M1;
            h2[i + 1] = (h2[i] * B + c) % M2; p2[i + 1] = (p2[i] * B) % M2;
        }

        int lo = 1, hi = n - 1, bestLen = 0, bestStart = 0;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            int start = check(mid, n);
            if (start != -1) {          // a duplicate of length mid exists → try longer
                bestLen = mid;
                bestStart = start;
                lo = mid + 1;
            } else {
                hi = mid - 1;           // none of length mid → none longer either
            }
        }
        return s.substring(bestStart, bestStart + bestLen);
    }

    private long key(int l, int r) {
        long a = ((h1[r] - h1[l] * p1[r - l]) % M1 + M1) % M1;
        long b = ((h2[r] - h2[l] * p2[r - l]) % M2 + M2) % M2;
        return a * M2 + b;              // exact, < 2^52
    }

    // start index of a repeated window of length L, or -1
    private int check(int L, int n) {
        Set<Long> seen = new HashSet<>();
        for (int i = 0; i + L <= n; i++) {
            if (!seen.add(key(i, i + L))) return i;
        }
        return -1;
    }
}
