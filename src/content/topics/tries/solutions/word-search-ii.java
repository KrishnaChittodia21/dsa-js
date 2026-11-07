class TrieNode {
    TrieNode[] next = new TrieNode[26];
    int childCount = 0;
    String word = null;
}

class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public String[] findWords(char[][] board, String[] words) {
        TrieNode root = new TrieNode();
        for (String w : words) {
            TrieNode node = root;
            for (char ch : w.toCharArray()) {
                int k = ch - 'a';
                if (node.next[k] == null) {
                    node.next[k] = new TrieNode();
                    node.childCount++;
                }
                node = node.next[k];
            }
            node.word = w;
        }

        List<String> found = new ArrayList<>();
        for (int r = 0; r < board.length; r++) {
            for (int c = 0; c < board[0].length; c++) dfs(board, r, c, root, found);
        }
        return found.toArray(new String[0]);
    }

    private void dfs(char[][] board, int r, int c, TrieNode parent, List<String> found) {
        char ch = board[r][c];
        TrieNode node = parent.next[ch - 'a'];
        if (node == null) return;                   // prune: not a prefix of any word
        if (node.word != null) {
            found.add(node.word);
            node.word = null;                       // report each word once
        }
        board[r][c] = '#';                          // mark visited
        for (int[] d : DIRS) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && board[nr][nc] != '#') {
                dfs(board, nr, nc, node, found);
            }
        }
        board[r][c] = ch;                           // backtrack
        if (node.childCount == 0 && node.word == null) { // drop dead leaf
            parent.next[ch - 'a'] = null;
            parent.childCount--;
        }
    }
}
