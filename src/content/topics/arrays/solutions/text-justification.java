class Solution {
    public String[] fullJustify(String[] words, int maxWidth) {
        List<String> lines = new ArrayList<>();
        int i = 0;
        while (i < words.length) {
            // 1. greedily pack words[i..j-1]
            int j = i + 1;
            int letters = words[i].length();
            while (j < words.length && letters + words[j].length() + (j - i) <= maxWidth) {
                letters += words[j].length();   // (j - i) = spaces needed so far, one per gap
                j++;
            }
            int count = j - i;
            boolean isLast = j == words.length;

            // 2. format the line
            StringBuilder sb = new StringBuilder();
            if (isLast || count == 1) {
                sb.append(String.join(" ", Arrays.copyOfRange(words, i, j)));
                while (sb.length() < maxWidth) sb.append(' ');
            } else {
                int gaps = count - 1;
                int spaces = maxWidth - letters;
                int base = spaces / gaps;
                int extra = spaces % gaps;          // leftmost gaps get one more
                for (int k = i; k < j; k++) {
                    sb.append(words[k]);
                    int g = k - i;
                    if (g < gaps) sb.append(" ".repeat(base + (g < extra ? 1 : 0)));
                }
            }
            lines.add(sb.toString());
            i = j;
        }
        return lines.toArray(new String[0]);
    }
}
