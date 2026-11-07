class Solution {
    public boolean exist(char[][] board, String word) {
        // Cheap pruning: the board must contain enough of every letter.
        Map<Character, Integer> count = new HashMap<>();
        for (char[] row : board) for (char ch : row) count.merge(ch, 1, (a, b) -> a + b);
        Map<Character, Integer> need = new HashMap<>();
        for (char ch : word.toCharArray()) need.merge(ch, 1, (a, b) -> a + b);
        for (var e : need.entrySet()) {
            if (count.getOrDefault(e.getKey(), 0) < e.getValue()) return false;
        }

        // Start from the rarer end of the word (fewer starting points -> less branching).
        if (count.getOrDefault(word.charAt(0), 0) > count.getOrDefault(word.charAt(word.length() - 1), 0)) {
            word = new StringBuilder(word).reverse().toString();
        }

        char[] w = word.toCharArray();
        for (int r = 0; r < board.length; r++) {
            for (int c = 0; c < board[0].length; c++) {
                if (dfs(board, w, r, c, 0)) return true;
            }
        }
        return false;
    }

    private boolean dfs(char[][] board, char[] word, int r, int c, int k) {
        if (k == word.length) return true;
        if (r < 0 || c < 0 || r >= board.length || c >= board[0].length || board[r][c] != word[k]) return false;
        char saved = board[r][c];
        board[r][c] = '#';                          // mark: on the current path
        boolean found = dfs(board, word, r + 1, c, k + 1) || dfs(board, word, r - 1, c, k + 1)
                || dfs(board, word, r, c + 1, k + 1) || dfs(board, word, r, c - 1, k + 1);
        board[r][c] = saved;                        // restore for other paths
        return found;
    }
}
