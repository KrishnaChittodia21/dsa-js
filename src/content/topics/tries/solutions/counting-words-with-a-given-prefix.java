class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    int count;   // words passing through this node
}

class Solution {
    public int prefixCount(String[] words, String pref) {
        TrieNode root = new TrieNode();
        for (String w : words) {          // duplicates are inserted twice, so their counts add up
            TrieNode node = root;
            for (char ch : w.toCharArray()) {
                node = node.children.computeIfAbsent(ch, c -> new TrieNode());
                node.count++;
            }
        }
        TrieNode node = root;
        for (char ch : pref.toCharArray()) {
            node = node.children.get(ch);
            if (node == null) return 0;
        }
        return node.count;
    }
}
