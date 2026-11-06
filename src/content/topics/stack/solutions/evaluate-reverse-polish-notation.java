class Solution {
    public int evalRPN(String[] tokens) {
        Deque<Integer> st = new ArrayDeque<>();
        for (String t : tokens) {
            if (t.equals("+") || t.equals("-") || t.equals("*") || t.equals("/")) {
                int b = st.pop(); // right operand (pushed last)
                int a = st.pop(); // left operand
                switch (t) {
                    case "+" -> st.push(a + b);
                    case "-" -> st.push(a - b);
                    case "*" -> st.push(a * b);
                    default -> st.push(a / b); // Java division already rounds toward zero
                }
            } else {
                st.push(Integer.parseInt(t));
            }
        }
        return st.pop();
    }
}
