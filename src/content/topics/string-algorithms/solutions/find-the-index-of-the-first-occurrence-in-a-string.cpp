class Solution {
public:
    int strStr(string haystack, string needle) {
        int m = needle.size();
        if (m == 0) return 0;

        // lps[i] = longest proper prefix of needle[0..i] that is also a suffix
        vector<int> lps(m, 0);
        for (int i = 1, len = 0; i < m; i++) {
            while (len > 0 && needle[i] != needle[len]) len = lps[len - 1];
            if (needle[i] == needle[len]) len++;
            lps[i] = len;
        }

        for (int i = 0, j = 0; i < (int) haystack.size(); i++) {
            while (j > 0 && haystack[i] != needle[j]) j = lps[j - 1]; // reuse the matched part
            if (haystack[i] == needle[j]) j++;
            if (j == m) return i - m + 1;
        }
        return -1;
    }
};
