class TrieNode {
    TrieNode[] next = new TrieNode[26];
    boolean isEnd = false;
}

class Solution {
    private final TrieNode root = new TrieNode();

    public String[] findAllConcatenatedWordsInADict(String[] words) {
        for (String w : words) {
            TrieNode node = root;
            for (char ch : w.toCharArray()) {
                if (node.next[ch - 'a'] == null) node.next[ch - 'a'] = new TrieNode();
                node = node.next[ch - 'a'];
            }
            node.isEnd = true;
        }

        List<String> result = new ArrayList<>();
        for (String w : words) {
            if (ok(w, 0, new Boolean[w.length() + 1])) result.add(w);
        }
        return result.toArray(new String[0]);
    }

    // ok(start): can w[start..] be split into dictionary words?
    private boolean ok(String w, int start, Boolean[] memo) {
        int n = w.length();
        if (start == n) return true;
        if (memo[start] != null) return memo[start];
        TrieNode node = root;
        for (int i = start; i < n; i++) {
            node = node.next[w.charAt(i) - 'a'];
            if (node == null) break;                               // no word continues this way
            boolean wholeWord = start == 0 && i == n - 1;          // w itself does not count
            if (node.isEnd && !wholeWord && ok(w, i + 1, memo)) return memo[start] = true;
        }
        return memo[start] = false;
    }
}
