class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEnd;
}

class Solution {
    public String longestCommonPrefix(String[] strs) {
        // Build a trie of all strings.
        TrieNode root = new TrieNode();
        for (String s : strs) {
            TrieNode node = root;
            for (char ch : s.toCharArray()) node = node.children.computeIfAbsent(ch, c -> new TrieNode());
            node.isEnd = true;
        }
        // Follow the single-child chain until a branch or a word end.
        StringBuilder prefix = new StringBuilder();
        TrieNode node = root;
        while (node.children.size() == 1 && !node.isEnd) {
            var only = node.children.entrySet().iterator().next();
            char ch = only.getKey();
            prefix.append(ch);
            node = only.getValue();
        }
        return prefix.toString();
    }
}
