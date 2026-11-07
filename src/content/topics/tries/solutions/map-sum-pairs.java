class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    int sum;
}

class MapSum {
    private final TrieNode root = new TrieNode();
    private final Map<String, Integer> values = new HashMap<>();   // key -> current value

    public MapSum() {
    }

    public void insert(String key, int val) {
        int delta = val - values.getOrDefault(key, 0);              // handles overwrite
        values.put(key, val);
        TrieNode node = root;
        for (char ch : key.toCharArray()) {
            node = node.children.computeIfAbsent(ch, c -> new TrieNode());
            node.sum += delta;                                      // every prefix of key gains delta
        }
    }

    public int sum(String prefix) {
        TrieNode node = root;
        for (char ch : prefix.toCharArray()) {
            node = node.children.get(ch);
            if (node == null) return 0;
        }
        return node.sum;
    }
}
