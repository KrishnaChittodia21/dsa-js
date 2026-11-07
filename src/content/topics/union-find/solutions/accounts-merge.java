class UnionFind {
    private final int[] parent;
    private final int[] size;
    int count;

    UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        count = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
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
        parent[rb] = ra;
        size[ra] += size[rb];
        count--;
        return true;
    }

    boolean connected(int a, int b) {
        return find(a) == find(b);
    }
}

class Solution {
    public String[][] accountsMerge(String[][] accounts) {
        UnionFind uf = new UnionFind(accounts.length);
        Map<String, Integer> owner = new HashMap<>(); // email -> first account index

        for (int i = 0; i < accounts.length; i++) {
            for (int k = 1; k < accounts[i].length; k++) {
                String email = accounts[i][k];
                Integer j = owner.get(email);
                if (j != null) uf.union(i, j);
                else owner.put(email, i);
            }
        }

        Map<Integer, List<String>> groups = new HashMap<>(); // root account -> emails
        for (var en : owner.entrySet()) {
            groups.computeIfAbsent(uf.find(en.getValue()), r -> new ArrayList<>()).add(en.getKey());
        }

        String[][] result = new String[groups.size()][];
        int at = 0;
        for (var g : groups.entrySet()) {
            List<String> emails = g.getValue();
            Collections.sort(emails);                 // plain string order, as required
            String[] row = new String[emails.size() + 1];
            row[0] = accounts[g.getKey()][0];
            for (int k = 0; k < emails.size(); k++) row[k + 1] = emails.get(k);
            result[at++] = row;
        }
        return result;
    }
}
