class TrieNode {
    TrieNode[] next = new TrieNode[26];
    boolean isEnd = false;
}

class Solution {
    private final TrieNode root = new TrieNode();

    public String replaceWords(String[] dictionary, String sentence) {
        for (String r : dictionary) {
            TrieNode node = root;
            for (char ch : r.toCharArray()) {
                if (node.next[ch - 'a'] == null) node.next[ch - 'a'] = new TrieNode();
                node = node.next[ch - 'a'];
            }
            node.isEnd = true;
        }

        String[] words = sentence.split(" ");
        for (int i = 0; i < words.length; i++) words[i] = shortestRoot(words[i]);
        return String.join(" ", words);
    }

    private String shortestRoot(String word) {
        TrieNode node = root;
        for (int i = 0; i < word.length(); i++) {
            node = node.next[word.charAt(i) - 'a'];
            if (node == null) return word;              // no root is a prefix
            if (node.isEnd) return word.substring(0, i + 1); // first root hit = shortest
        }
        return word;
    }
}
