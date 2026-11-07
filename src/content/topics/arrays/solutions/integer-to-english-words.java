class Solution {
    private static final String[] ONES = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"};
    private static final String[] TENS = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};
    private static final String[] SCALES = {"", "Thousand", "Million", "Billion"};

    public String numberToWords(int num) {
        if (num == 0) return "Zero";
        List<String> result = new ArrayList<>();
        for (int scale = 0; num > 0; scale++) {
            int chunk = num % 1000;
            if (chunk > 0) {
                List<String> words = chunkWords(chunk);
                if (!SCALES[scale].isEmpty()) words.add(SCALES[scale]);
                result.addAll(0, words);         // higher chunks go in front
            }
            num /= 1000;
        }
        return String.join(" ", result);
    }

    // words for 1..999
    private List<String> chunkWords(int n) {
        List<String> words = new ArrayList<>();
        int hundreds = n / 100;
        int rest = n % 100;
        if (hundreds > 0) {
            words.add(ONES[hundreds]);
            words.add("Hundred");
        }
        if (rest >= 20) {
            words.add(TENS[rest / 10]);
            if (rest % 10 > 0) words.add(ONES[rest % 10]);
        } else if (rest > 0) {
            words.add(ONES[rest]);                 // 1..19 are irregular
        }
        return words;
    }
}
