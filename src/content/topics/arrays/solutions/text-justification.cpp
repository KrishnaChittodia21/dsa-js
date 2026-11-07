class Solution {
public:
    vector<string> fullJustify(vector<string>& words, int maxWidth) {
        vector<string> lines;
        int n = words.size();
        int i = 0;
        while (i < n) {
            // 1. greedily pack words[i..j-1]
            int j = i + 1;
            int letters = words[i].size();
            while (j < n && letters + (int)words[j].size() + (j - i) <= maxWidth) {
                letters += words[j].size();   // (j - i) = spaces needed so far, one per gap
                j++;
            }
            int count = j - i;
            bool isLast = j == n;

            // 2. format the line
            string line;
            if (isLast || count == 1) {
                for (int k = i; k < j; k++) {
                    if (k > i) line += ' ';
                    line += words[k];
                }
                line.resize(maxWidth, ' ');
            } else {
                int gaps = count - 1;
                int spaces = maxWidth - letters;
                int base = spaces / gaps;
                int extra = spaces % gaps;          // leftmost gaps get one more
                for (int k = i; k < j; k++) {
                    line += words[k];
                    int g = k - i;
                    if (g < gaps) line += string(base + (g < extra ? 1 : 0), ' ');
                }
            }
            lines.push_back(line);
            i = j;
        }
        return lines;
    }
};
