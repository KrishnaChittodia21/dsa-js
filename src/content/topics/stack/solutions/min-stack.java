class MinStack {
    private final Deque<int[]> st = new ArrayDeque<>();   // entries: {value, minimum of this entry and all below}

    public MinStack() {
    }

    public void push(int val) {
        int below = st.isEmpty() ? Integer.MAX_VALUE : st.peek()[1];
        st.push(new int[]{val, Math.min(val, below)});
    }

    public void pop() {
        st.pop();
    }

    public int top() {
        return st.peek()[0];
    }

    public int getMin() {
        return st.peek()[1];
    }
}
