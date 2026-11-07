class Solution {
public:
    bool isValid(string s) {
        if (s.size() % 2 == 1) return false;
        unordered_map<char, char> partner = {{')', '('}, {']', '['}, {'}', '{'}};
        stack<char> st;
        for (char ch : s) {
            if (partner.count(ch)) {
                if (st.empty() || st.top() != partner[ch]) return false;
                st.pop();
            } else {
                st.push(ch);
            }
        }
        return st.empty();
    }
};
