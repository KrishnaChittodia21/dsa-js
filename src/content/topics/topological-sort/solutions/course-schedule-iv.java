class Solution {
    public boolean[] checkIfPrerequisite(int numCourses, int[][] prerequisites, int[][] queries) {
        int n = numCourses;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[n];
        for (int[] p : prerequisites) { adj.get(p[0]).add(p[1]); indeg[p[1]]++; } // a before b

        // reach[v][u] = true if u is a (possibly indirect) prerequisite of v
        boolean[][] reach = new boolean[n][n];
        int[] queue = new int[n];
        int tail = 0;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
        for (int head = 0; head < tail; head++) {
            int u = queue[head]; // reach[u] is final
            for (int v : adj.get(u)) {
                reach[v][u] = true;
                for (int k = 0; k < n; k++) if (reach[u][k]) reach[v][k] = true;
                if (--indeg[v] == 0) queue[tail++] = v;
            }
        }
        boolean[] answer = new boolean[queries.length];
        for (int i = 0; i < queries.length; i++) answer[i] = reach[queries[i][1]][queries[i][0]];
        return answer;
    }
}
