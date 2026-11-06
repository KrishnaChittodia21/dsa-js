class Solution {
    public int calculate(String s) {
        Deque<Long> stack = new ArrayDeque<>();
        long result = 0; // value of the current (innermost) group so far
        long sign = 1;   // sign in front of the number being read
        long num = 0;

        for (char ch : s.toCharArray()) {
            if (Character.isDigit(ch)) {
                num = num * 10 + (ch - '0');
            } else if (ch == '+' || ch == '-') {
                result += sign * num;
                num = 0;
                sign = ch == '+' ? 1 : -1;
            } else if (ch == '(') {
                stack.push(result); // save the outer context
                stack.push(sign);
                result = 0;
                sign = 1;
            } else if (ch == ')') {
                result += sign * num; // finish the inner group
                num = 0;
                long outerSign = stack.pop();
                long outerResult = stack.pop();
                result = outerResult + outerSign * result;
            }
            // spaces are ignored
        }
        return (int) (result + sign * num);
    }
}
