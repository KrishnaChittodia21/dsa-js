class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEnd;
}

class Trie {
    private final TrieNode root = new TrieNode();

    public Trie() {
    }

    public void insert(String word) {
        TrieNode node = root;
        for (char ch : word.toCharArray()) node = node.children.computeIfAbsent(ch, c -> new TrieNode());
        node.isEnd = true;
    }

    public boolean search(String word) {
        TrieNode node = walk(word);
        return node != null && node.isEnd;
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;
    }

    private TrieNode walk(String s) {
        TrieNode node = root;
        for (char ch : s.toCharArray()) {
            node = node.children.get(ch);
            if (node == null) return null;
        }
        return node;
    }
}
