class UnionFind {
    private final int[] parent, size;
    int count;

    UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        count = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]]; // path halving
            x = parent[x];
        }
        return x;
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra; // union by size
        size[ra] += size[rb];
        count--;
        return true;
    }
}

class Solution {
    public int[] numIslands2(int m, int n, int[][] positions) {
        UnionFind uf = new UnionFind(m * n);
        boolean[] land = new boolean[m * n];
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int[] answer = new int[positions.length];
        int islands = 0;

        for (int i = 0; i < positions.length; i++) {
            int r = positions[i][0], c = positions[i][1];
            int id = r * n + c;
            if (!land[id]) {
                land[id] = true;
                islands++; // a brand-new island of size 1
                for (int[] d : dirs) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                    int nb = nr * n + nc;
                    if (land[nb] && uf.union(id, nb)) islands--; // merged two islands
                }
            }
            answer[i] = islands;
        }
        return answer;
    }
}
