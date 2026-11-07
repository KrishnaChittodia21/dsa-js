class Solution {
    public int ladderLength(String beginWord, String endWord, String[] wordList) {
        Set<String> dict = new HashSet<>(Arrays.asList(wordList));
        if (!dict.contains(endWord)) return 0;
        dict.remove(beginWord);
        dict.remove(endWord);                   // words left in dict = not yet visited

        Set<String> front = new HashSet<>(List.of(beginWord));
        Set<String> back = new HashSet<>(List.of(endWord));
        int length = 1;                         // words in the sequence so far

        while (!front.isEmpty() && !back.isEmpty()) {
            if (front.size() > back.size()) {   // expand the smaller side
                Set<String> t = front; front = back; back = t;
            }
            length++;
            Set<String> next = new HashSet<>();
            for (String word : front) {
                char[] chars = word.toCharArray();
                for (int i = 0; i < chars.length; i++) {
                    char orig = chars[i];
                    for (char ch = 'a'; ch <= 'z'; ch++) {
                        chars[i] = ch;
                        String cand = new String(chars);
                        if (back.contains(cand)) return length;   // the two searches meet
                        if (dict.remove(cand)) next.add(cand);
                    }
                    chars[i] = orig;
                }
            }
            front = next;
        }
        return 0;
    }
}
