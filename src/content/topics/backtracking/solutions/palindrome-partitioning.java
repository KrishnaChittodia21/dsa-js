class Solution {
    public String[][] partition(String s) {
        List<String[]> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result.toArray(new String[0][]);
    }

    private void backtrack(String s, int start, List<String> path, List<String[]> result) {
        if (start == s.length()) {               // the whole string is cut into palindromes
            result.add(path.toArray(new String[0]));
            return;
        }
        for (int end = start; end < s.length(); end++) {
            if (!isPalindrome(s, start, end)) continue;   // prune this cut
            path.add(s.substring(start, end + 1));
            backtrack(s, end + 1, path, result);
            path.remove(path.size() - 1);
        }
    }

    private boolean isPalindrome(String s, int l, int r) {
        while (l < r) if (s.charAt(l++) != s.charAt(r--)) return false;
        return true;
    }
}
