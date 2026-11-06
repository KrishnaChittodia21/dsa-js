class TrieNode {
    TrieNode[] next = new TrieNode[26];
    List<String> top = new ArrayList<>();
}

class Solution {
    public String[][] suggestedProducts(String[] products, String searchWord) {
        String[] sorted = products.clone();
        Arrays.sort(sorted);                        // sorted insert → first 3 are the smallest
        TrieNode root = new TrieNode();
        for (String p : sorted) {
            TrieNode node = root;
            for (char ch : p.toCharArray()) {
                if (node.next[ch - 'a'] == null) node.next[ch - 'a'] = new TrieNode();
                node = node.next[ch - 'a'];
                if (node.top.size() < 3) node.top.add(p);
            }
        }

        String[][] out = new String[searchWord.length()][];
        TrieNode node = root;
        for (int i = 0; i < searchWord.length(); i++) {
            node = node == null ? null : node.next[searchWord.charAt(i) - 'a']; // once lost, stay lost
            out[i] = node == null ? new String[0] : node.top.toArray(new String[0]);
        }
        return out;
    }
}
