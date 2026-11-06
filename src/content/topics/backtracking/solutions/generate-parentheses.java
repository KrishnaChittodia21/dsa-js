class Solution {
    public String[] generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        backtrack(n, 0, 0, new StringBuilder(), result);
        return result.toArray(new String[0]);
    }

    private void backtrack(int n, int open, int close, StringBuilder path, List<String> result) {
        if (path.length() == 2 * n) {
            result.add(path.toString());
            return;
        }
        if (open < n) {                 // can still open a new pair
            path.append('(');
            backtrack(n, open + 1, close, path, result);
            path.deleteCharAt(path.length() - 1);
        }
        if (close < open) {             // there is an unmatched '(' to close
            path.append(')');
            backtrack(n, open, close + 1, path, result);
            path.deleteCharAt(path.length() - 1);
        }
    }
}
