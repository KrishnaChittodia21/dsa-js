class Solution {
    public boolean isValidSudoku(char[][] board) {
        Set<String> seen = new HashSet<>();
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                char d = board[r][c];
                if (d == '.') continue;
                int b = (r / 3) * 3 + c / 3;
                String[] keys = { "r" + r + ":" + d, "c" + c + ":" + d, "b" + b + ":" + d };
                for (String k : keys) {
                    if (!seen.add(k)) return false;   // same digit twice in a row/col/box
                }
            }
        }
        return true;
    }
}
