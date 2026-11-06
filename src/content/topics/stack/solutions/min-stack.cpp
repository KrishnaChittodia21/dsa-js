class MinStack {
    vector<pair<int, int>> st;   // entries: {value, minimum of this entry and all below}

public:
    MinStack() {}

    void push(int val) {
        int below = st.empty() ? INT_MAX : st.back().second;
        st.emplace_back(val, min(val, below));
    }

    void pop() {
        st.pop_back();
    }

    int top() {
        return st.back().first;
    }

    int getMin() {
        return st.back().second;
    }
};
