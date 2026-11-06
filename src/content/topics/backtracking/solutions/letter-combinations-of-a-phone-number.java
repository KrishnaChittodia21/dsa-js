class Solution {
    private static final String[] KEYPAD = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    private List<String> result = new ArrayList<>();
    private StringBuilder path = new StringBuilder();

    public String[] letterCombinations(String digits) {
        if (digits.isEmpty()) return new String[0];
        backtrack(digits, 0);
        return result.toArray(new String[0]);
    }

    private void backtrack(String digits, int i) {
        if (i == digits.length()) {
            result.add(path.toString()); // build the string once, at the leaf
            return;
        }
        for (char ch : KEYPAD[digits.charAt(i) - '0'].toCharArray()) {
            path.append(ch);
            backtrack(digits, i + 1);
            path.deleteCharAt(path.length() - 1);
        }
    }
}
