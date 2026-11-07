class Solution {
    const vector<string> ONES = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"};
    const vector<string> TENS = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};
    const vector<string> SCALES = {"", "Thousand", "Million", "Billion"};

    // words for 1..999
    vector<string> chunkWords(int n) {
        vector<string> words;
        int hundreds = n / 100;
        int rest = n % 100;
        if (hundreds > 0) {
            words.push_back(ONES[hundreds]);
            words.push_back("Hundred");
        }
        if (rest >= 20) {
            words.push_back(TENS[rest / 10]);
            if (rest % 10 > 0) words.push_back(ONES[rest % 10]);
        } else if (rest > 0) {
            words.push_back(ONES[rest]);                 // 1..19 are irregular
        }
        return words;
    }

public:
    string numberToWords(int num) {
        if (num == 0) return "Zero";
        vector<string> result;
        for (int scale = 0; num > 0; scale++) {
            int chunk = num % 1000;
            if (chunk > 0) {
                vector<string> words = chunkWords(chunk);
                if (!SCALES[scale].empty()) words.push_back(SCALES[scale]);
                result.insert(result.begin(), words.begin(), words.end()); // higher chunks go in front
            }
            num /= 1000;
        }
        string out;
        for (const string& w : result) {
            if (!out.empty()) out += ' ';
            out += w;
        }
        return out;
    }
};
