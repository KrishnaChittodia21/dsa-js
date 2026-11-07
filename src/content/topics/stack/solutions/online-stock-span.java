class StockSpanner {
    private final Deque<int[]> st = new ArrayDeque<>(); // {price, span}; prices strictly decreasing

    public StockSpanner() {
    }

    public int next(int price) {
        int span = 1;
        while (!st.isEmpty() && st.peek()[0] <= price) {
            span += st.pop()[1]; // today covers that day's whole span
        }
        st.push(new int[] {price, span});
        return span;
    }
}
