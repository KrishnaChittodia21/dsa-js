class Solution {
    public boolean rotateString(String s, String goal) {
        if (s.length() != goal.length()) return false;
        String text = s + s;
        int m = goal.length();

        int[] lps = new int[m];
        for (int i = 1, len = 0; i < m; i++) {
            while (len > 0 && goal.charAt(i) != goal.charAt(len)) len = lps[len - 1];
            if (goal.charAt(i) == goal.charAt(len)) len++;
            lps[i] = len;
        }
        for (int i = 0, j = 0; i < text.length(); i++) {
            while (j > 0 && text.charAt(i) != goal.charAt(j)) j = lps[j - 1];
            if (text.charAt(i) == goal.charAt(j)) j++;
            if (j == m) return true;
        }
        return false;
    }
}
