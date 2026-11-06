class Solution {
public:
    int calculate(string s) {
        stack<long long> st;
        long long result = 0; // value of the current (innermost) group so far
        long long sign = 1;   // sign in front of the number being read
        long long num = 0;

        for (char ch : s) {
            if (isdigit(ch)) {
                num = num * 10 + (ch - '0');
            } else if (ch == '+' || ch == '-') {
                result += sign * num;
                num = 0;
                sign = ch == '+' ? 1 : -1;
            } else if (ch == '(') {
                st.push(result); // save the outer context
                st.push(sign);
                result = 0;
                sign = 1;
            } else if (ch == ')') {
                result += sign * num; // finish the inner group
                num = 0;
                long long outerSign = st.top(); st.pop();
                long long outerResult = st.top(); st.pop();
                result = outerResult + outerSign * result;
            }
            // spaces are ignored
        }
        return (int) (result + sign * num);
    }
};
