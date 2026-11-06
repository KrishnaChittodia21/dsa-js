class RandomizedCollection {
    private final List<Integer> vals = new ArrayList<>();              // one slot per copy
    private final Map<Integer, Set<Integer>> idx = new HashMap<>();    // value -> indices in vals
    private final Random rng = new Random();

    public RandomizedCollection() {
    }

    public boolean insert(int val) {
        Set<Integer> slots = idx.computeIfAbsent(val, k -> new HashSet<>());
        boolean wasAbsent = slots.isEmpty();
        slots.add(vals.size());
        vals.add(val);
        return wasAbsent;
    }

    public boolean remove(int val) {
        Set<Integer> slots = idx.get(val);
        if (slots == null || slots.isEmpty()) return false;
        int i = slots.iterator().next();            // any copy of val
        slots.remove(i);

        int lastIdx = vals.size() - 1;
        int last = vals.get(lastIdx);
        vals.set(i, last);                          // move last element into the hole
        Set<Integer> lastSlots = idx.get(last);
        lastSlots.add(i);                           // add first...
        lastSlots.remove(lastIdx);                  // ...then delete (handles i == lastIdx)
        vals.remove(lastIdx);

        if (slots.isEmpty()) idx.remove(val);
        return true;
    }

    public int getRandom() {
        return vals.get(rng.nextInt(vals.size()));
    }
}
