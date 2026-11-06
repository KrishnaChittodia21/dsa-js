class LRUCache {
    private final int capacity;
    private final LinkedHashMap<Integer, Integer> map = new LinkedHashMap<>(16, 0.75f, true); // access order

    public LRUCache(int capacity) {
        this.capacity = capacity;
    }

    public int get(int key) {
        return map.getOrDefault(key, -1);
    }

    public void put(int key, int value) {
        map.put(key, value);
        if (map.size() > capacity) map.remove(map.keySet().iterator().next()); // least recently used
    }
}
