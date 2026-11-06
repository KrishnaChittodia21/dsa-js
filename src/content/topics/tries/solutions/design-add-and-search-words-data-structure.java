class TrieNode {
    TrieNode[] next = new TrieNode[26];
    boolean isEnd = false;
}

class WordDictionary {
    private final TrieNode root = new TrieNode();

    public WordDictionary() {
    }

    public void addWord(String word) {
        TrieNode node = root;
        for (char ch : word.toCharArray()) {
            if (node.next[ch - 'a'] == null) node.next[ch - 'a'] = new TrieNode();
            node = node.next[ch - 'a'];
        }
        node.isEnd = true;
    }

    public boolean search(String word) {
        return dfs(word, root, 0);
    }

    private boolean dfs(String word, TrieNode node, int i) {
        if (i == word.length()) return node.isEnd;
        char ch = word.charAt(i);
        if (ch == '.') {
            for (TrieNode child : node.next) {
                if (child != null && dfs(word, child, i + 1)) return true; // any matching branch is enough
            }
            return false;
        }
        TrieNode next = node.next[ch - 'a'];
        return next != null && dfs(word, next, i + 1);
    }
}
