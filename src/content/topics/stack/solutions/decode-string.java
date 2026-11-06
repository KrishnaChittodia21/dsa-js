class Solution {
    public String decodeString(String s) {
        Deque<String> prevs = new ArrayDeque<>();  // saved contexts: string before '['
        Deque<Integer> counts = new ArrayDeque<>(); // ... and its repeat count
        StringBuilder cur = new StringBuilder();
        int num = 0;
        for (char ch : s.toCharArray()) {
            if (Character.isDigit(ch)) {
                num = num * 10 + (ch - '0'); // multi-digit counts
            } else if (ch == '[') {
                prevs.push(cur.toString());
                counts.push(num);
                cur = new StringBuilder();
                num = 0;
            } else if (ch == ']') {
                String inner = cur.toString();
                cur = new StringBuilder(prevs.pop()).append(inner.repeat(counts.pop()));
            } else {
                cur.append(ch);
            }
        }
        return cur.toString();
    }
}
