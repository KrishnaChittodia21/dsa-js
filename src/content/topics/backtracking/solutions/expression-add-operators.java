class Solution {
    private List<String> result = new ArrayList<>();
    private String num;
    private int target;

    public String[] addOperators(String num, int target) {
        this.num = num;
        this.target = target;
        backtrack(0, "", 0, 0);
        return result.toArray(new String[0]);
    }

    // value and last are long: a 10-digit operand or a product can pass 2^31
    // last: the last signed term (needed to undo it for '*')
    private void backtrack(int pos, String expr, long value, long last) {
        if (pos == num.length()) {
            if (value == target) result.add(expr);
            return;
        }
        for (int end = pos; end < num.length(); end++) {
            if (end > pos && num.charAt(pos) == '0') break; // no leading zeros ("05")
            String piece = num.substring(pos, end + 1);
            long x = Long.parseLong(piece);
            if (pos == 0) {
                backtrack(end + 1, piece, x, x);            // first operand: no operator
            } else {
                backtrack(end + 1, expr + "+" + piece, value + x, x);
                backtrack(end + 1, expr + "-" + piece, value - x, -x);
                backtrack(end + 1, expr + "*" + piece, value - last + last * x, last * x);
            }
        }
    }
}
