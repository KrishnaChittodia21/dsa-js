class Solution {
    public int findJudge(int n, int[][] trust) {
        int[] score = new int[n + 1];              // in-degree minus out-degree
        for (int[] t : trust) {
            score[t[0]]--;                         // a trusts someone → cannot be the judge
            score[t[1]]++;
        }
        for (int p = 1; p <= n; p++) if (score[p] == n - 1) return p;
        return -1;
    }
}
