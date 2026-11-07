class Solution {
    public int nearestExit(char[][] maze, int[] entrance) {
        int R = maze.length, C = maze[0].length;
        int sr = entrance[0], sc = entrance[1];
        maze[sr][sc] = '+';                        // mark visited
        List<int[]> frontier = new ArrayList<>();
        frontier.add(new int[]{sr, sc});
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        for (int steps = 0; !frontier.isEmpty(); steps++) {
            List<int[]> next = new ArrayList<>();
            for (int[] cell : frontier) {
                for (int[] d : dirs) {
                    int nr = cell[0] + d[0], nc = cell[1] + d[1];
                    if (nr < 0 || nc < 0 || nr >= R || nc >= C || maze[nr][nc] != '.') continue;
                    if (nr == 0 || nc == 0 || nr == R - 1 || nc == C - 1) return steps + 1;
                    maze[nr][nc] = '+';            // mark when enqueued
                    next.add(new int[]{nr, nc});
                }
            }
            frontier = next;
        }
        return -1;
    }
}
