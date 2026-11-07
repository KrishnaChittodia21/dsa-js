class Solution {
    public boolean isValid(String s) {
        if (s.length() % 2 == 1) return false;
        Map<Character, Character> partner = Map.of(')', '(', ']', '[', '}', '{');
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : s.toCharArray()) {
            if (partner.containsKey(ch)) {
                if (stack.isEmpty() || stack.pop() != partner.get(ch)) return false;
            } else {
                stack.push(ch);
            }
        }
        return stack.isEmpty();
    }
}
