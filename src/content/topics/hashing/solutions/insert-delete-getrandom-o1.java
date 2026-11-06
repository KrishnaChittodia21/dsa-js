class RandomizedSet {
    private final List<Integer> vals = new ArrayList<>();      // values, for O(1) random access
    private final Map<Integer, Integer> pos = new HashMap<>(); // value -> index in vals
    private final Random rand = new Random();

    public RandomizedSet() {
    }

    public boolean insert(int val) {
        if (pos.containsKey(val)) return false;
        pos.put(val, vals.size());
        vals.add(val);
        return true;
    }

    public boolean remove(int val) {
        if (!pos.containsKey(val)) return false;
        int i = pos.get(val);
        int last = vals.get(vals.size() - 1);
        vals.set(i, last);            // move the last element into the hole
        pos.put(last, i);
        vals.remove(vals.size() - 1); // O(1): remove from the end
        pos.remove(val);              // last, so it also works when val == last
        return true;
    }

    public int getRandom() {
        return vals.get(rand.nextInt(vals.size()));
    }
}
