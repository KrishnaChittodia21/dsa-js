class Solution {
    private final Map<String, List<Integer>> memo = new HashMap<>(); // substring → all its values

    public int[] diffWaysToCompute(String expression) {
        return solve(expression).stream().mapToInt(Integer::intValue).toArray();
    }

    private List<Integer> solve(String expr) {
        if (memo.containsKey(expr)) return memo.get(expr);
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < expr.length(); i++) {
            char op = expr.charAt(i);
            if (op != '+' && op != '-' && op != '*') continue;
            List<Integer> left = solve(expr.substring(0, i));   // every value of the left side
            List<Integer> right = solve(expr.substring(i + 1)); // every value of the right side
            for (int a : left) {
                for (int b : right) {
                    out.add(op == '+' ? a + b : op == '-' ? a - b : a * b);
                }
            }
        }
        if (out.isEmpty()) out.add(Integer.parseInt(expr)); // base case: plain number
        memo.put(expr, out);
        return out;
    }
}
