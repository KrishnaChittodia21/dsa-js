class Solution {
public:
    vector<int> partitionLabels(string s) {
        int last[128] = {}; // char -> last index
        for (int i = 0; i < (int)s.size(); i++) last[(unsigned char)s[i]] = i;
        vector<int> sizes;
        int start = 0, end = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            end = max(end, last[(unsigned char)s[i]]); // part must reach this char's last copy
            if (i == end) {                            // nothing in [start, i] continues further
                sizes.push_back(end - start + 1);
                start = i + 1;
            }
        }
        return sizes;
    }
};
