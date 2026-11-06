class Solution {
public:
    int firstUniqChar(string s) {
        vector<int> count(26, 0);
        queue<int> q;  // indices of characters seen once, in order
        for (int i = 0; i < (int)s.size(); i++) {
            int c = s[i] - 'a';
            if (count[c]++ == 0) q.push(i);  // first sighting -> candidate
            // drop candidates that turned into duplicates
            while (!q.empty() && count[s[q.front()] - 'a'] > 1) q.pop();
        }
        return q.empty() ? -1 : q.front();
    }
};
