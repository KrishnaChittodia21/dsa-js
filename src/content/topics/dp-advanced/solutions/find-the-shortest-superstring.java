class Solution {
    public String shortestSuperstring(String[] words) {
        int n = words.length;
        // overlap[i][j] = longest suffix of words[i] that is a prefix of words[j]
        int[][] overlap = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) continue;
                String a = words[i], b = words[j];
                for (int k = Math.min(a.length(), b.length()) - 1; k > 0; k--) {
                    if (a.endsWith(b.substring(0, k))) { overlap[i][j] = k; break; }
                }
            }
        }
        int N = 1 << n;
        int[][] dp = new int[N][n];
        int[][] parent = new int[N][n];
        for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE);
        for (int[] row : parent) Arrays.fill(row, -1);
        for (int i = 0; i < n; i++) dp[1 << i][i] = words[i].length();
        for (int mask = 1; mask < N; mask++) {
            for (int last = 0; last < n; last++) {
                if ((mask & (1 << last)) == 0 || dp[mask][last] == Integer.MAX_VALUE) continue;
                for (int j = 0; j < n; j++) {
                    if ((mask & (1 << j)) != 0) continue;
                    int next = mask | (1 << j);
                    int cand = dp[mask][last] + words[j].length() - overlap[last][j];
                    if (cand < dp[next][j]) { dp[next][j] = cand; parent[next][j] = last; }
                }
            }
        }
        // best final word
        int full = N - 1;
        int last = 0;
        for (int i = 1; i < n; i++) if (dp[full][i] < dp[full][last]) last = i;
        // walk parents back to recover the order
        List<Integer> order = new ArrayList<>();
        int mask = full;
        while (last != -1) {
            order.add(last);
            int prev = parent[mask][last];
            mask ^= 1 << last;
            last = prev;
        }
        Collections.reverse(order);
        StringBuilder result = new StringBuilder(words[order.get(0)]);
        for (int t = 1; t < order.size(); t++) {
            result.append(words[order.get(t)].substring(overlap[order.get(t - 1)][order.get(t)]));
        }
        return result.toString();
    }
}
