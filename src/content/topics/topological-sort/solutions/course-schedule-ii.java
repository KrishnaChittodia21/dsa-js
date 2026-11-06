class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            indeg[p[0]]++;
        }
        int[] order = new int[numCourses];         // doubles as the queue
        int size = 0;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) order[size++] = i;
        for (int head = 0; head < size; head++) {
            for (int next : adj.get(order[head])) {
                if (--indeg[next] == 0) order[size++] = next;
            }
        }
        return size == numCourses ? order : new int[0];
    }
}
