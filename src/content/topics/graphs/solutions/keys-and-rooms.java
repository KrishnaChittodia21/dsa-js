class Solution {
    public boolean canVisitAllRooms(int[][] rooms) {
        int n = rooms.length;
        boolean[] visited = new boolean[n];
        visited[0] = true;
        int count = 1;
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        stack.push(0);
        while (!stack.isEmpty()) {
            int room = stack.pop();
            for (int key : rooms[room]) {
                if (!visited[key]) {
                    visited[key] = true;
                    count++;
                    stack.push(key);
                }
            }
        }
        return count == n;
    }
}
