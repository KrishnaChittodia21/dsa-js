class Solution {
    private final Map<String, String> parent = new HashMap<>();
    private final Map<String, Double> weight = new HashMap<>(); // weight[x] = x / parent[x]

    public double[] calcEquation(String[][] equations, double[] values, String[][] queries) {
        parent.clear(); weight.clear();
        for (int i = 0; i < equations.length; i++) {
            String a = equations[i][0], b = equations[i][1];
            add(a);
            add(b);
            union(a, b, values[i]);
        }

        double[] ans = new double[queries.length];
        for (int i = 0; i < queries.length; i++) {
            String c = queries[i][0], d = queries[i][1];
            if (!parent.containsKey(c) || !parent.containsKey(d) || !find(c).equals(find(d))) ans[i] = -1.0;
            else ans[i] = weight.get(c) / weight.get(d);
        }
        return ans;
    }

    private void add(String x) {
        if (!parent.containsKey(x)) {
            parent.put(x, x);
            weight.put(x, 1.0);
        }
    }

    private String find(String x) {
        String p = parent.get(x);
        if (!p.equals(x)) {
            String root = find(p);                   // compresses p; weight[p] = p / root
            weight.put(x, weight.get(x) * weight.get(p));
            parent.put(x, root);
        }
        return parent.get(x);
    }

    private void union(String a, String b, double k) { // a / b = k
        String ra = find(a), rb = find(b);
        if (ra.equals(rb)) return;
        parent.put(ra, rb);
        weight.put(ra, k * weight.get(b) / weight.get(a));
    }
}
