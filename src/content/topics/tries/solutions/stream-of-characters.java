class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEnd;
}

class StreamChecker {
    private final TrieNode root = new TrieNode();
    private int maxLen = 0;
    private StringBuilder history = new StringBuilder();

    public StreamChecker(String[] words) {
        for (String w : words) {
            maxLen = Math.max(maxLen, w.length());
            TrieNode node = root;
            for (int i = w.length() - 1; i >= 0; i--) {   // insert REVERSED
                node = node.children.computeIfAbsent(w.charAt(i), c -> new TrieNode());
            }
            node.isEnd = true;
        }
    }

    public boolean query(String letter) {
        history.append(letter.charAt(0));
        if (history.length() > 2 * maxLen) {              // keep only what can still matter
            history.delete(0, history.length() - maxLen);
        }
        TrieNode node = root;
        int n = history.length();
        for (int i = n - 1; i >= 0 && i >= n - maxLen; i--) {
            node = node.children.get(history.charAt(i));
            if (node == null) return false;                // no word ends like this
            if (node.isEnd) return true;
        }
        return false;
    }
}
