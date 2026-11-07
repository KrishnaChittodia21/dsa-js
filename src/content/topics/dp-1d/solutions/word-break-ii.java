class Solution {
    public String[] wordBreak(String s, String[] wordDict) {
        Set<String> dict = new HashSet<>(Arrays.asList(wordDict));
        Map<Integer, List<String>> memo = new HashMap<>(); // start index -> sentences for s[start..]
        return sentences(s, 0, dict, memo).toArray(new String[0]);
    }

    private List<String> sentences(String s, int start, Set<String> dict, Map<Integer, List<String>> memo) {
        if (start == s.length()) return List.of("");      // one way to finish: nothing left
        if (memo.containsKey(start)) return memo.get(start);
        List<String> result = new ArrayList<>();
        for (int end = start + 1; end <= s.length(); end++) {
            String word = s.substring(start, end);
            if (!dict.contains(word)) continue;
            for (String tail : sentences(s, end, dict, memo)) {
                result.add(tail.isEmpty() ? word : word + " " + tail);
            }
        }
        memo.put(start, result);
        return result;
    }
}
