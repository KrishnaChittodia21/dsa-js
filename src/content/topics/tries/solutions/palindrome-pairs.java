class TrieNode {
    TrieNode[] next = new TrieNode[26];
    int index = -1;
    List<Integer> palBelow = new ArrayList<>();
}

class Solution {
    public int[][] palindromePairs(String[] words) {
        // Insert each word REVERSED. palBelow at a node lists words whose remaining
        // (not yet inserted) prefix is a palindrome.
        TrieNode root = new TrieNode();
        for (int idx = 0; idx < words.length; idx++) {
            String w = words[idx];
            TrieNode node = root;
            for (int k = w.length() - 1; k >= 0; k--) {
                if (isPal(w, 0, k)) node.palBelow.add(idx);
                int ch = w.charAt(k) - 'a';
                if (node.next[ch] == null) node.next[ch] = new TrieNode();
                node = node.next[ch];
            }
            node.index = idx;
            node.palBelow.add(idx);                 // empty remainder is a palindrome
        }

        List<int[]> out = new ArrayList<>();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            TrieNode node = root;
            for (int k = 0; k < w.length() && node != null; k++) {
                // Case 1: a reversed word ends here and the rest of w is a palindrome
                if (node.index >= 0 && node.index != i && isPal(w, k, w.length() - 1)) out.add(new int[]{i, node.index});
                node = node.next[w.charAt(k) - 'a'];
            }
            if (node == null) continue;
            // Case 2: w consumed; words continuing below with a palindromic remainder
            for (int j : node.palBelow) if (j != i) out.add(new int[]{i, j});
        }
        return out.toArray(new int[0][]);
    }

    private boolean isPal(String s, int i, int j) {
        while (i < j) if (s.charAt(i++) != s.charAt(j--)) return false;
        return true;
    }
}
