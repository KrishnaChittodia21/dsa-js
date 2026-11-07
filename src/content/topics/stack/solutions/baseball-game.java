class Solution {
    public int calPoints(String[] ops) {
        List<Integer> st = new ArrayList<>();
        for (String op : ops) {
            int n = st.size();
            if (op.equals("+")) st.add(st.get(n - 1) + st.get(n - 2));
            else if (op.equals("D")) st.add(2 * st.get(n - 1));
            else if (op.equals("C")) st.remove(n - 1);
            else st.add(Integer.parseInt(op));
        }
        int sum = 0;
        for (int x : st) sum += x;
        return sum;
    }
}
