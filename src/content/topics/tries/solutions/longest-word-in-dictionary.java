class TrieNode {
    TrieNode[] next = new TrieNode[26];
    String word = null;
}

class Solution {
    private String best = "";

    public String longestWord(String[] words) {
        TrieNode root = new TrieNode();
        for (String w : words) {
            TrieNode node = root;
            for (char ch : w.toCharArray()) {
                if (node.next[ch - 'a'] == null) node.next[ch - 'a'] = new TrieNode();
                node = node.next[ch - 'a'];
            }
            node.word = w;                          // mark end of word (store it for output)
        }
        dfs(root);
        return best;
    }

    private void dfs(TrieNode node) {
        for (TrieNode child : node.next) {          // a → z: first hit at a length is the smallest
            if (child == null || child.word == null) continue; // prefix must itself be a word
            if (child.word.length() > best.length()) best = child.word;
            dfs(child);
        }
    }
}
