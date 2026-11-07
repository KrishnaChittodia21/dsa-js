class LFUCache {
    private final int cap;
    private final Map<Integer, Integer> values = new HashMap<>();
    private final Map<Integer, Integer> freqs = new HashMap<>();
    private final Map<Integer, LinkedHashSet<Integer>> freqMap = new HashMap<>(); // insertion order = least recent first
    private int minFreq = 0;

    public LFUCache(int capacity) {
        cap = capacity;
    }

    private void touch(int key) {
        int f = freqs.get(key);
        LinkedHashSet<Integer> bucket = freqMap.get(f);
        bucket.remove(key);
        if (bucket.isEmpty()) {
            freqMap.remove(f);
            if (minFreq == f) minFreq = f + 1;
        }
        freqs.put(key, f + 1);
        freqMap.computeIfAbsent(f + 1, k -> new LinkedHashSet<>()).add(key);
    }

    public int get(int key) {
        if (!values.containsKey(key)) return -1;
        touch(key);
        return values.get(key);
    }

    public void put(int key, int value) {
        if (cap == 0) return;
        if (values.containsKey(key)) {
            values.put(key, value);
            touch(key);
            return;
        }
        if (values.size() >= cap) {
            LinkedHashSet<Integer> bucket = freqMap.get(minFreq);
            int victim = bucket.iterator().next(); // least recent among least frequent
            bucket.remove(victim);
            if (bucket.isEmpty()) freqMap.remove(minFreq);
            values.remove(victim);
            freqs.remove(victim);
        }
        values.put(key, value);
        freqs.put(key, 1);
        freqMap.computeIfAbsent(1, k -> new LinkedHashSet<>()).add(key);
        minFreq = 1;
    }
}
