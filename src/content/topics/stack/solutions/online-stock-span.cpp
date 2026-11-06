class StockSpanner {
public:
    StockSpanner() {
    }

    int next(int price) {
        int span = 1;
        while (!st.empty() && st.top().first <= price) {
            span += st.top().second; // today covers that day's whole span
            st.pop();
        }
        st.push({price, span});
        return span;
    }

private:
    stack<pair<int, int>> st; // {price, span}; prices strictly decreasing
};
