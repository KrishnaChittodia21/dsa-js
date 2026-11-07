class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);               // pre must come before course
            indeg[p[0]]++;
        }
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) queue.add(i);
        int taken = 0;
        while (!queue.isEmpty()) {
            taken++;
            for (int next : adj.get(queue.poll())) {
                if (--indeg[next] == 0) queue.add(next);
            }
        }
        return taken == numCourses;                // fewer → some courses are stuck on a cycle
    }
}
