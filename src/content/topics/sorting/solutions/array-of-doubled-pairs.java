class Solution {
    public boolean canReorderDoubled(int[] arr) {
        Map<Integer, Integer> count = new HashMap<>();
        for (int x : arr) count.merge(x, 1, (a, b) -> a + b);

        List<Integer> keys = new ArrayList<>(count.keySet());
        keys.sort((a, b) -> Math.abs(a) - Math.abs(b));
        for (int x : keys) {
            int c = count.get(x);
            if (c == 0) continue;                  // all copies already used as doubles
            if (x == 0) {
                if (c % 2 != 0) return false;      // zeros pair with zeros
                continue;
            }
            int doubles = count.getOrDefault(2 * x, 0);
            if (doubles < c) return false;         // x's partner is forced to be 2x
            count.put(2 * x, doubles - c);
        }
        return true;
    }
}
