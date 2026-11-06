class Solution {
public:
    string decodeString(string s) {
        stack<pair<string, int>> st; // saved contexts: {stringBefore, repeatCount}
        string cur;
        int num = 0;
        for (char ch : s) {
            if (isdigit(ch)) {
                num = num * 10 + (ch - '0'); // multi-digit counts
            } else if (ch == '[') {
                st.push({cur, num});
                cur.clear();
                num = 0;
            } else if (ch == ']') {
                auto [prev, k] = st.top();
                st.pop();
                for (int i = 0; i < k; i++) prev += cur;
                cur = prev;
            } else {
                cur += ch;
            }
        }
        return cur;
    }
};
