class Solution {
    private static final long M1 = 67108859, M2 = 67108837, B = 131;
    private long[] h1, h2, p1, p2;

    public int distinctEchoSubstrings(String text) {
        int n = text.length();
        h1 = new long[n + 1]; h2 = new long[n + 1];
        p1 = new long[n + 1]; p2 = new long[n + 1];
        p1[0] = p2[0] = 1;
        for (int i = 0; i < n; i++) {
            int c = text.charAt(i);
            h1[i + 1] = (h1[i] * B + c) % M1; p1[i + 1] = (p1[i] * B) % M1;
            h2[i + 1] = (h2[i] * B + c) % M2; p2[i + 1] = (p2[i] * B) % M2;
        }

        int total = 0;
        for (int L = 1; 2 * L <= n; L++) {
            Set<Long> seen = new HashSet<>();           // echoes of total length 2L
            for (int i = 0; i + 2 * L <= n; i++) {
                if (get(i, i + L) == get(i + L, i + 2 * L)) seen.add(get(i, i + 2 * L));
            }
            total += seen.size();
        }
        return total;
    }

    // exact numeric key for text[l..r): both residues packed into one long
    private long get(int l, int r) {
        long a = ((h1[r] - h1[l] * p1[r - l]) % M1 + M1) % M1;
        long b = ((h2[r] - h2[l] * p2[r - l]) % M2 + M2) % M2;
        return a * M2 + b;
    }
}
