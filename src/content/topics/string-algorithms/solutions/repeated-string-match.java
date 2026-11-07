class Solution {
    public int repeatedStringMatch(String a, String b) {
        int n = a.length(), m = b.length();
        int q = (m + n - 1) / n;

        int[] lps = new int[m];
        for (int i = 1, len = 0; i < m; i++) {
            while (len > 0 && b.charAt(i) != b.charAt(len)) len = lps[len - 1];
            if (b.charAt(i) == b.charAt(len)) len++;
            lps[i] = len;
        }

        int limit = (q + 1) * n;                      // enough text for any first occurrence
        for (int i = 0, j = 0; i < limit; i++) {
            char c = a.charAt(i % n);                 // virtual repeated string, never built
            while (j > 0 && c != b.charAt(j)) j = lps[j - 1];
            if (c == b.charAt(j)) j++;
            if (j == m) return (i + n) / n;           // copies needed to reach index i
        }
        return -1;
    }
}
