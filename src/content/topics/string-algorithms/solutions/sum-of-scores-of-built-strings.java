class Solution {
    public long sumScores(String s) {
        int n = s.length();
        int[] z = new int[n];
        z[0] = n;                                       // the whole string matches itself
        long total = n;
        for (int i = 1, l = 0, r = 0; i < n; i++) {     // z-box [l, r)
            if (i < r) z[i] = Math.min(r - i, z[i - l]);                              // reuse the mirror, capped at r
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;      // extend beyond known region
            if (i + z[i] > r) {
                l = i;
                r = i + z[i];
            }
            total += z[i];
        }
        return total;
    }
}
